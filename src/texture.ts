/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

import { Nullable, int, uint32_t, size_t, BuildArray } from "./types";
import { ContextWebGPU } from "./context";
import { ProgramWebGPU } from "./program";

/**
 * Defines an abstract Texture for Aquarium.
 */
export class Texture {

    protected _urls: string[];
    protected _width: int = 0;
    protected _height: int = 0;
    protected _flip: boolean;
    protected _name: string;

    constructor(name: string, urls: string | string[], flip: boolean) {
        this._name = name;
        this._urls = Array.isArray(urls) ? urls : [urls];
        this._flip = flip;
    }

    public dispose(): void { }

    public get name(): string {
        return this._name;
    }

    public static async loadImage(urls: Array<string>): Promise<Array<HTMLImageElement>> {
        return new Promise(async (resolve, reject) => {
            let images: Array<HTMLImageElement> = [];
            for (let i: size_t = 0; i < urls.length; ++i) {
                const img = new Image();
                try {
                    img.src = urls[i];
                    await img.decode();
                } catch (e) {
                    console.error("Unable to load image from url: " + urls[i]);
                    reject(images);
                }
                images.push(img);
            }
            resolve(images);
        });
    }

    protected resizeImage(img: HTMLImageElement, width: uint32_t, height: uint32_t): ImageData {
        const imageCanvas: HTMLCanvasElement = document.createElement('canvas');
        imageCanvas.width = img.width;
        imageCanvas.height = img.height;

        const imageCanvasContext: CanvasRenderingContext2D = imageCanvas.getContext('2d');
        if (this._flip) {
            imageCanvasContext.translate(0, height);
            imageCanvasContext.scale(1, -1);
        }
        imageCanvasContext.drawImage(img, 0, 0, width, height);
        const imageData: ImageData = imageCanvasContext.getImageData(0, 0, width, height);
        return imageData;
    }

    protected isPowerOf2(value: int): boolean {
        return (value & (value - 1)) == 0;
    }

    /**
     * Free image data after upload to gpu. 
     */
    protected destroyImageData(pixelVec: Float32Array[] | Uint16Array[] | Array<Uint8ClampedArray>): void {
        pixelVec.length = 0;
    }

    public loadTexture(): void {}

    public getImagePixels(image: HTMLImageElement): Uint8ClampedArray {
        const imageCanvas = document.createElement('canvas');
        imageCanvas.width = image.width;
        imageCanvas.height = image.height;

        const imageCanvasContext = imageCanvas.getContext('2d');
        if (this._flip) {
            imageCanvasContext.translate(0, image.height);
            imageCanvasContext.scale(1, -1);
        }
        imageCanvasContext.drawImage(image, 0, 0, image.width, image.height);
        const imageData: ImageData = imageCanvasContext.getImageData(0, 0, image.width, image.height);

        let data: Uint8ClampedArray = null;

        const bytesPerRow = Math.ceil(image.width * 4 / 256) * 256;
        if (bytesPerRow == image.width * 4) {
            data = imageData.data;
        } else {
            data = new Uint8ClampedArray(bytesPerRow * image.height);
            let imagePixelIndex = 0;
            for (let y = 0; y < image.height; ++y) {
                for (let x = 0; x < image.width; ++x) {
                    let i = x * 4 + y * bytesPerRow;
                    data[i] = imageData.data[imagePixelIndex];
                    data[i + 1] = imageData.data[imagePixelIndex + 1];
                    data[i + 2] = imageData.data[imagePixelIndex + 2];
                    data[i + 3] = imageData.data[imagePixelIndex + 3];
                    imagePixelIndex += 4;
                }
            }
        }

        return data;
    }

}

export class TextureWebGPU extends Texture {

    private _textureDimension: GPUTextureDimension; // texture 2D or CubeMap
    private _textureViewDimension: GPUTextureViewDimension;
    private _texture: GPUTexture;
    private _sampler: GPUSampler;
    private _format: GPUTextureFormat;
    private _textureView: GPUTextureView;
    private _images: Array<HTMLImageElement>;
    private _pixelVec: Array<Uint8ClampedArray>;
    private _resizedVec: Array<Uint8ClampedArray>;
    private _context: Nullable<ContextWebGPU> = null;
    private _gpuTextureHelper: WebGPUTextureHelper = null

    constructor(context: Nullable<ContextWebGPU>, name: string, urls: string | string[]) {
        super(name, Array.isArray(urls) ? urls : [urls], Array.isArray(urls) ? false : true)
        this._textureDimension = "2d";
        this._textureViewDimension = Array.isArray(urls) ? "cube" : "2d";
        this._format = "rgba8unorm"
        this._context = context
        this._gpuTextureHelper = new WebGPUTextureHelper(context)
    }

    public dispose(): void {
        this.destroyImageData(this._pixelVec);
        this.destroyImageData(this._resizedVec);
        this._textureView = null;
        this._texture     = null;
        this._sampler     = null;
    }
    
    public get textureDimension(): GPUTextureDimension {
        return this._textureDimension;
    }

    public get textureViewDimension(): GPUTextureViewDimension {
        return this._textureViewDimension;
    }

    public get textureId(): GPUTexture {
        return this._texture;
    }

    public get sampler(): GPUSampler {
        return this._sampler;
    }

    public get textureView(): GPUTextureView {
        return this._textureView;
    }

    private _onImageLoaded(): void {
        if (this._images.length > 0) {
            this._width = this._images[0].width;
            this._height = this._images[0].height;
            this._pixelVec = BuildArray(this._images.length, () => null);
        }
    }

    public async loadTexture(): Promise<void> {
        return Promise.resolve().then(async () => {
            const kPadding: int = 256;
            this._images = await Texture.loadImage(this._urls);
            this._onImageLoaded();
            
            if (this._textureViewDimension === "cube") {
                const descriptor: GPUTextureDescriptor = {
                    dimension: this._textureDimension,
                    size: <GPUExtent3DDict> {
                        width: this._width,
                        height: this._height,
                        depth: 6 // arrayLayerCount ?
                    },
                    sampleCount: 1,
                    format: this._format,
                    mipLevelCount: 1,
                    usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.SAMPLED
                };
                this._texture = this._context.createTexture(descriptor);
                
                for (let i: uint32_t = 0; i < 6; ++i) {
                    let [resultBuffer, resultData] = this._context.createBufferMapped(
                        GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
                        this._width * this._height * 4
                    );
                    this._pixelVec[i] = this.getImagePixels(this._images[i]);
                    new Uint8Array(resultData).set(this._pixelVec[i]);
                    resultBuffer.unmap();

                    let bufferCopyView: GPUBufferCopyView = this._context.createBufferCopyView(resultBuffer, 0, this._width * 4, this._height);
                    let textureCopyView: GPUTextureCopyView = this._context.createTextureCopyView(
                        this._texture, 0, i,
                        <GPUOrigin3DDict> {
                            x: 0,
                            y: 0,
                            z: 0
                        }
                    );
                    const copySize: GPUExtent3DDict = {
                        width: this._width,
                        height: this._height,
                        depth: 1
                    };
                    this._context.commandBuffers.push(
                        this._context.copyBufferToTexture(bufferCopyView, textureCopyView, copySize)
                    );
                }

                const viewDescriptor: GPUTextureViewDescriptor = {
                    dimension: "cube",
                    format: this._format,
                    baseMipLevel: 0,
                    mipLevelCount: 1,
                    baseArrayLayer: 0,
                    arrayLayerCount: 6
                }
        
                this._textureView = this._texture.createView(viewDescriptor);
        
                let samplerDesc: GPUSamplerDescriptor = {
                    addressModeU: "clamp-to-edge",
                    addressModeV: "clamp-to-edge",
                    addressModeW: "clamp-to-edge",
                    minFilter: "linear",
                    magFilter: "linear",
                    mipmapFilter: "nearest"
                };
        
                this._sampler = this._context.createSampler(samplerDesc);
            }
            else { // "2d"
                this._texture = await this._gpuTextureHelper.generateMipmappedTexture(this._urls[0]);
                this._width = this._gpuTextureHelper.imageBitmapSize.width;
                this._height = this._gpuTextureHelper.imageBitmapSize.height;
                
                const viewDescriptor: GPUTextureViewDescriptor = {
                    dimension: "2d",
                    format: this._format,
                    baseMipLevel: 0,
                    mipLevelCount: Math.trunc(Math.floor(Math.log2(Math.min(this._width, this._height)))) + 1,
                    baseArrayLayer: 0,
                    arrayLayerCount: 1
                }
        
                this._textureView = this._texture.createView(viewDescriptor);
        
                let samplerDesc: GPUSamplerDescriptor = {
                    addressModeU: "clamp-to-edge",
                    addressModeV: "clamp-to-edge",
                    addressModeW: "clamp-to-edge",
                    minFilter: "linear",
                    magFilter: "linear",
                    mipmapFilter: (this.isPowerOf2(this._width) && this.isPowerOf2(this._height)) ? "linear" : "nearest"
                };
        
                this._sampler = this._context.createSampler(samplerDesc);
            }
        });
    }
}

/**
 * Class containing helper functions for creating textures.
 * @see https://github.com/toji/webgpu-test
 */
export class WebGPUTextureHelper {

    private _context: Nullable<ContextWebGPU> = null;
    private _device: GPUDevice = null;

    public mipmapSampler: GPUSampler;
    public mipmapBindGroupLayout: GPUBindGroupLayout;
    public mipmapPipeline: GPURenderPipeline;
    public imageBitmapSize: GPUExtent3DDict;

    constructor(context: Nullable<ContextWebGPU>) {
        this._context = context
        this._device = this._context.device;
  
        const mipmapVertexShaderSource = `#version 450
            const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));
            const vec2 tex[4] = vec2[4](vec2(0.0f, 0.0f), vec2(1.0f, 0.0f), vec2(0.0f, 1.0f), vec2(1.0f, 1.0f));
            layout(location = 0) out vec2 vTex;
            void main() {
            vTex = tex[gl_VertexIndex];
            gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
            }
        `;
  
        const mipmapFragmentShaderSource = `#version 450
            layout(set = 0, binding = 0) uniform sampler imgSampler;
            layout(set = 0, binding = 1) uniform texture2D img;
            layout(location = 0) in vec2 vTex;
            layout(location = 0) out vec4 outColor;
            void main() {
            outColor = texture(sampler2D(img, imgSampler), vTex);
            }
        `;
  
        this.mipmapSampler = this._context.createSampler(
            <GPUSamplerDescriptor> {
                minFilter: 'linear'
            }
        );

        this.mipmapBindGroupLayout = this._context.makeBindGroupLayout(
            <GPUBindGroupLayoutDescriptor> {
                entries: <GPUBindGroupLayoutEntry[]> [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "sampler"
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "sampled-texture"
                    },
                ]
            }
        );
  
        this.mipmapPipeline = this._device.createRenderPipeline(<GPURenderPipelineDescriptor> {
            layout: this._device.createPipelineLayout(
                <GPUPipelineLayoutDescriptor> {
                    bindGroupLayouts: <GPUBindGroupLayout[]> [
                        this.mipmapBindGroupLayout
                    ]
                }
            ),
            vertexStage: <GPUProgrammableStageDescriptor> {
                module: this._device.createShaderModule(
                    <GPUShaderModuleDescriptor> {
                        code: this._context.glslang.compileGLSL(mipmapVertexShaderSource, 'vertex')
                    }
                ),
                entryPoint: 'main'
            },
            fragmentStage: <GPUProgrammableStageDescriptor> {
                module: this._device.createShaderModule(
                    <GPUShaderModuleDescriptor> {
                        code: this._context.glslang.compileGLSL(mipmapFragmentShaderSource, 'fragment')
                    }
                ),
                entryPoint: 'main'
            },
            primitiveTopology: 'triangle-strip',
            colorStates: <GPUColorStateDescriptor[]> [
                <GPUColorStateDescriptor> {
                    format: 'rgba8unorm',
                }
            ]
        });
    }
  
    async generateMipmappedTexture(url: string): Promise<GPUTexture> {
        return new Promise(async (resolve, reject) => {
            const image: HTMLImageElement = (await Texture.loadImage([url]))[0];
            let imageBitmap: ImageBitmap = await createImageBitmap(image,  0,  0, image.width, image.height);

            this.imageBitmapSize = <GPUExtent3DDict> {
                width: imageBitmap.width,
                height: imageBitmap.height,
                depth: 1,
            }

            const textureSize: GPUExtent3DDict = <GPUExtent3DDict> {
                width: imageBitmap.width,
                height: imageBitmap.height,
                depth: 1,
            }
            const mipLevelCount: uint32_t = Math.floor(Math.log2(Math.max(imageBitmap.width, imageBitmap.height))) + 1;
        
            // Populate the top level of the srcTexture with the imageBitmap.
            const srcTexture: GPUTexture = this._device.createTexture(<GPUTextureDescriptor> {
                size: textureSize,
                format: 'rgba8unorm',
                usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.SAMPLED | GPUTextureUsage.OUTPUT_ATTACHMENT,
                mipLevelCount
            });
            this._device.defaultQueue.copyImageBitmapToTexture({ imageBitmap }, { texture: srcTexture }, textureSize);
        
            // BUG: The fact that we have to create a second texture here is due to a bug in Chrome that doesn't allow you to
            // use a single texture as both a sampler and a output attachement at the same time. If we could do that this code
            // would use half as much GPU allocations and no copyTextureToTexture calls.
            const mipmappedTexture: GPUTexture = this._device.createTexture(<GPUTextureDescriptor> {
                size: textureSize,
                format: 'rgba8unorm',
                usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.SAMPLED | GPUTextureUsage.OUTPUT_ATTACHMENT,
                mipLevelCount
            });
        
            const commandEncoder: GPUCommandEncoder = this._device.createCommandEncoder({});
        
            // BUG: Chrome currently says that if any level of a texture is incomplete the entire thing gets wiped to black when
            // you attempt to sample from it. This is despite the fact that below we're using texture views restricted
            // exclusively to the known populated mip levels. As a result in order for this code to work properly we first have
            // to clear EVERY level of the mip chain (except the first, which was populated with copyImageBitmapToTexture)
            // before we can render with it.
            for (let i: uint32_t = 1; i < mipLevelCount; ++i) {
                const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(<GPURenderPassDescriptor> {
                    colorAttachments: [
                        <GPURenderPassColorAttachmentDescriptor> {
                            attachment: srcTexture.createView(<GPUTextureViewDescriptor> {
                                baseMipLevel: i,
                                mipLevelCount: 1
                            }),
                            loadValue: { r: 1.0, g: 0.0, b: 0.0, a: 0.0 },
                        }
                    ],
                });
                passEncoder.endPass();
            }
        
            for (let i = 0; i < mipLevelCount; ++i) {
                const bindGroup: GPUBindGroup = this._device.createBindGroup(<GPUBindGroupDescriptor> {
                    layout: this.mipmapBindGroupLayout,
                    entries: <GPUBindGroupEntry[]> [
                        {
                            binding: 0,
                            resource: this.mipmapSampler,
                        },
                        {
                            binding: 1,
                            resource: srcTexture.createView(<GPUTextureViewDescriptor> {
                                baseMipLevel: Math.max(0, i-1),
                                mipLevelCount: 1
                            }),
                        }
                    ],
                });
        
                const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(
                    <GPURenderPassDescriptor> {
                        colorAttachments: <GPURenderPassColorAttachmentDescriptor[]> [
                            {
                                attachment: mipmappedTexture.createView(
                                    <GPUTextureViewDescriptor> {
                                        baseMipLevel: i,
                                        mipLevelCount: 1
                                    }
                                ),
                                loadValue: 'load',
                            }
                        ],
                    }
                );
                passEncoder.setPipeline(this.mipmapPipeline);
                passEncoder.setBindGroup(0, bindGroup);
                passEncoder.draw(4, 1, 0, 0);
                passEncoder.endPass();
        
                commandEncoder.copyTextureToTexture(
                    {
                        texture: mipmappedTexture,
                        mipLevel: i
                    },
                    {
                        texture: srcTexture,
                        mipLevel: i
                    },
                    textureSize
                );
        
                textureSize.width = Math.ceil(textureSize.width / 2);
                textureSize.height = Math.ceil(textureSize.height / 2);
            }
            this._device.defaultQueue.submit([commandEncoder.finish()]);
        
            srcTexture.destroy();
        
            resolve(mipmappedTexture);
        });
    }
    
  }