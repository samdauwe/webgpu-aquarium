/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

import * as dat from 'dat.gui';
import { ASSERT, BuildArray, Nullable, float, int, uint32_t, size_t } from "./types";
import { Aquarium, TOGGLE, MODELGROUP, MODELNAME } from "./aquarium";
import { Buffer, BufferWebGPU } from "./buffer";
import { BufferManagerWebGPU, RingBufferWebGPU } from "./bufferManager";
import { FPSTimer } from "./fpsTimer";
import glslangModule from './glslang';
import { Model, FishModelWebGPU, FishModelInstancedDrawWebGPU, GenericModelWebGPU,
         InnerModelWebGPU, OutsideModelWebGPU, SeaweedModelWebGPU } from "./model";
import { Program, ProgramWebGPU } from "./program";
import { ResourceHelper } from "./resourceHelper";
import statsjsModule from './stats-js';
import { Texture, TextureWebGPU } from "./texture";
import { FishPerWithPadding, FogUniforms, LightUniforms, LightWorldPositionUniform } from "./uniforms";
import { ComboRenderPassDescriptor, ComboRenderPipelineDescriptor, ComboVertexStateDescriptor } from "./utils";

export enum SingleShaderStage { Vertex, Fragment, Compute };

/**
 * Defines the accessing to graphics API of a graphics backend.
 */
export class Context {

    protected _clientWidth: int;
    protected _clientHeight: int;
    protected _preTotalInstance: int;
    protected _curTotalInstance: int;

    protected _resourceHelper: Nullable<ResourceHelper> = null;

    protected _availableToggleBitset: Array<boolean>;
    protected _disableControlPanel: boolean;

    protected _showOptionWindow: boolean = true;
    protected _gui: dat.GUI;
    protected _guiSettings: any;
    protected _statsFPS: any;
    protected _statsFrameTime: any;
    protected _statsIntialized = false;

    constructor() {
        this._availableToggleBitset = BuildArray(TOGGLE.TOGGLEMAX, () => false);
    }

    public get clientWidth(): int {
        return this._clientWidth;
    }

    public get clientHeight(): int {
        return this._clientHeight;
    }

    public get availableToggleBitset(): Array<boolean> {
        return this._availableToggleBitset;
    }

    public get resourceHelper(): Nullable<ResourceHelper> {
        return this._resourceHelper;
    }

    public statsBegin(): void {
        this._statsFPS.begin();
        this._statsFrameTime.begin();
    }

    public statsEnd(): void {
        this._statsFPS.end();
        this._statsFrameTime.end();
    }

    public initialize(toggleBitset: Array<boolean>, canvas: HTMLCanvasElement): Promise<boolean> {
        return Promise.resolve().then(() => {
            return false;
        });
    }

    public createTextureWebGPU(name: string, urls: string | string[]): Promise<Nullable<Texture>> {
        return Promise.resolve().then(() => {
            return null;
        });
    }

    public shouldQuit(): boolean {
        return false;
    }

    public keyBoardQuit(): boolean {
        return false;
    }

    public createBufferWebGPU(numComponents: int, buffer: Float32Array | Uint16Array, isIndex: boolean): Nullable<Buffer> {
        return null;
    }

    public createProgram(vsId: string, fsId: string): Nullable<Program> {
        return null;
    }

    public doFlush(toggleBitset: Array<boolean>): void {}
    public terminate(): void {}
    public flush(): void {}
    public preFrame(): void {}
    public updateFPS(fpsTimer: FPSTimer, fisCountGetter: () => int, fisCountSetter: (fishCount: int) => void, toggleBitset: Array<boolean>): void {}
    
    public showFPS(canvas?: HTMLCanvasElement): void {
        if (!this._statsIntialized && canvas && this._statsFPS && this._statsFrameTime) {
            // FPS
            this._statsFPS.showPanel(0); // Panel 0 = fps
            this._statsFPS.domElement.style.cssText = 'position:absolute;top:10px;left:10px;';
            canvas.parentNode.appendChild(this._statsFPS.domElement);
            // Frame Time
            this._statsFrameTime.showPanel(1); // Panel 1 = ms
            this._statsFrameTime.domElement.style.cssText = 'position:absolute;top:10px;left:91px;';
            canvas.parentNode.appendChild(this._statsFrameTime.domElement);

            this._statsIntialized = true;
        }
    }

    public reallocResource(preTotalInstance: int, curTotalInstance: int, enableDynamicBufferOffset: boolean): void {}
    public updateAllFishData(): void {}
    public beginRenderPass(): void {}

    public createModel(aquarium: Nullable<Aquarium>, type: MODELGROUP, name: MODELNAME, blend: boolean): Nullable<Model> {
        return null;
    };

    public initGeneralResources(aquarium: Nullable<Aquarium>): void {}
    public updateWorldlUniforms(aquarium: Nullable<Aquarium>): void {}

    protected renderGUI(canvas: HTMLCanvasElement, fpsTimer: FPSTimer, fisCountGetter: () => int, fisCountSetter: (fishCount: int) => void, toggleBitset: Array<boolean>): void {
        if (!this._gui) {
            this._gui = new dat.GUI({ autoPlace: false});
            // Settings
            this._guiSettings = {
                Resolution: String(this._clientWidth + "x" + this.clientHeight),
                MSAAx4: Boolean(toggleBitset[TOGGLE.ENABLEMSAAx4] ? true : false),
                ALPHABLENDING: Boolean(toggleBitset[TOGGLE.ENABLEALPHABLENDING] ? true : false),
                DBO: Boolean(toggleBitset[TOGGLE.ENABLEDYNAMICBUFFEROFFSET] ? true : false),
                INSTANCEDDRAWS: Boolean(toggleBitset[TOGGLE.ENABLEINSTANCEDDRAWS] ? true : false),
                RENDERPASS: Boolean(toggleBitset[TOGGLE.DISABLED3D12RENDERPASS] ? false : true),
                VALIDATION: Boolean(toggleBitset[TOGGLE.DISABLEWEBGPUVALIDATION] ? false : true),
                BUFFERMAPPINGASNC: Boolean(toggleBitset[TOGGLE.BUFFERMAPPINGASYNC] ? true : false)
            };
            if (this._showOptionWindow) {
                this._guiSettings["NumberOfFish"] = Number(fisCountGetter());
            }
            let counter: uint32_t = 0;
            for (let prop in this._guiSettings) {
                const propStr = String(prop);                
                if (propStr === "NumberOfFish") {
                    const curfishCount = fisCountGetter();
                    let fishSelection: Array<int> = [1, 10000, 20000, 30000, 50000, 100000];
                    if (!fishSelection.includes(curfishCount)) {
                        fishSelection.push(curfishCount)
                        fishSelection.sort();
                    }
                    var fishCountMap = {};
                    for (let i: int=0; i<fishSelection.length; ++i) {
                        const fishSelectionItem: int = fishSelection[i];
                        fishCountMap[fishSelectionItem] = fishSelectionItem;
                    }
                    const property = this._gui.add(this._guiSettings, 'NumberOfFish', fishCountMap);
                    property.name("Number of Fish");
                    property.onFinishChange(function(value) {
                        fisCountSetter(value);
                    });
                }
                else {
                    const property = this._gui.add(this._guiSettings, String(prop))
                    const value: String | Boolean = this._guiSettings[prop];
                    if (typeof value === 'string' || value instanceof String) {
                        property.name(String(prop) + ": " + String(value));
                    }
                    else if (typeof value === 'boolean' || value instanceof Boolean) {
                        property.name(String(prop) + ": " + String(Boolean(value) ? "ON" : "OFF"));
                    }
                    property.domElement.style.pointerEvents = "none";
                    // Navigate through the DOM & add class to the 'span' element
                    this._gui.__ul.childNodes[counter++].childNodes[0].childNodes[0].classList += ' full_width';
                }
            }
            //  Add to canvas
            this._gui.domElement.style.position = 'absolute';
            this._gui.domElement.style.top = '10px';
            this._gui.domElement.style.right = '10px';
            canvas.parentNode.appendChild(this._gui.domElement);
        }
    }

    protected setWindowSize(windowWidth: int, windowHeight: int): void {
        if (windowWidth !== 0) {
            this._clientWidth = windowWidth;
        }
        if (windowHeight !== 0) {
            this._clientHeight = windowHeight;
        }
    }

    protected _initAvailableToggleBitset(): void { }

}

export class ContextWebGPU extends Context {
  
    public commandBuffers: Array<GPUCommandBuffer>;
    public queue: GPUQueue;

    public groupLayoutGeneral: GPUBindGroupLayout;
    public bindGroupGeneral: GPUBindGroup;
    public groupLayoutWorld: GPUBindGroupLayout;
    public bindGroupWorld: GPUBindGroup;

    public groupLayoutFishPer: GPUBindGroupLayout;
    public fishPersBuffer: GPUBuffer;
    public bindGroupFishPers: Array<GPUBindGroup>;

    public fishPers: Array<FishPerWithPadding>;

    public adapter: GPUAdapter; // The backend adapter
    public device: GPUDevice;
    
    private static readonly kSwapchainBackBufferUsage: GPUTextureUsageFlags =
        GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC;

    private _glslang: any;
    private _isSwapchainOutOfDate = false;
    private _canvas: HTMLCanvasElement;
    private _gpuCanvasContext: GPUCanvasContext;

    private _swapChain: GPUSwapChain;
    private _commandEncoder: GPUCommandEncoder;
    private _renderPass: GPURenderPassEncoder;
    private _renderPassDescriptor: Nullable<ComboRenderPassDescriptor> = null;

    private _backbufferView: GPUTextureView;
    private _sceneRenderTargetView: GPUTextureView;
    private _sceneDepthStencilView: GPUTextureView;
    private _pipeline: GPURenderPipeline;
    private _bindGroup: GPUBindGroup;
    private _preferredSwapChainFormat: GPUTextureFormat = "rgba8unorm";

    private _lightWorldPositionBuffer: GPUBuffer;
    private _lightBuffer: GPUBuffer;
    private _fogBuffer: GPUBuffer;

    private _enableMSAA: boolean = false;
    private _enableDynamicBufferOffset: boolean = false;
    private _enableFullScreenMode: boolean = false;

    private _bufferManager: Nullable<BufferManagerWebGPU> = null;

    constructor() {
        super();
        this.commandBuffers = new Array<GPUCommandBuffer>();
        this.bindGroupFishPers = new Array<GPUBindGroup>();
        this.fishPers = new Array<FishPerWithPadding>();
        this._resourceHelper = new ResourceHelper(document.location.toString());
        this._initAvailableToggleBitset();
    }

    public get glslang(): any {
        return this._glslang;
    }

    public dispose(): void {
        this._sceneRenderTargetView    = null;
        this._sceneDepthStencilView    = null;
        this._backbufferView           = null;
        this._pipeline                 = null;
        this._bindGroup                = null;
        this._lightWorldPositionBuffer = null;
        this._lightBuffer              = null;
        this._fogBuffer                = null;
        this._commandEncoder           = null;
        this.commandBuffers.length     = 0
        this._renderPass               = null;
        this._renderPassDescriptor     = null;
        this.groupLayoutGeneral        = null;
        this.bindGroupGeneral          = null;
        this.groupLayoutWorld          = null;
        this.bindGroupWorld            = null;
    
        this.groupLayoutFishPer        = null;
        this._destroyFishResource();
    
        this._swapChain                = null;
        this.queue                     = null;
        this.device                    = null;
    }

    public async initialize(toggleBitset: Array<boolean>, canvas: HTMLCanvasElement): Promise<boolean> {
        this._canvas = canvas;
        
        this._enableMSAA = toggleBitset[TOGGLE.ENABLEMSAAx4];
        this._disableControlPanel = toggleBitset[TOGGLE.DISABLECONTROLPANEL];
        this._enableFullScreenMode = toggleBitset[TOGGLE.ENABLEFULLSCREENMODE];

        // Set client width and height
        this._syncClientSize();
        
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                // Physical Device Adapter
                this.adapter = await navigator.gpu.requestAdapter();
    
                // Logical Device
                this.device = await this.adapter.requestDevice();
                if (typeof this.device.addEventListener === 'function') {
                    this.device.addEventListener('uncapturederror', (event) => {
                        console.error(event);
                    });
                }

                // GLSL to SPIR-V converter
                this._glslang = await glslangModule();
    
                // Queue
                this.queue = this.device.defaultQueue;

                // Canvas context
                this._gpuCanvasContext = canvas.getContext('gpupresent') as any;

                // Swap chain
                this._preferredSwapChainFormat = await this._gpuCanvasContext.getSwapChainPreferredFormat(this.device);
                this._swapChain = this._gpuCanvasContext.configureSwapChain(
                    <GPUSwapChainDescriptor> {
                        device: this.device,
                        format: this._preferredSwapChainFormat
                    }
                );

                // When MSAA is enabled, we create an intermediate multisampled texture to render the scene to.
                if (this._enableMSAA) {
                    this._sceneRenderTargetView = this.createMultisampledRenderTargetView();
                }

                this._sceneDepthStencilView = this.createDepthStencilView();

                // Recreate swapchain when window is resized
                window.addEventListener('resize', this._framebufferResizeCallback);
            
                // Create the buffer manager
                this._bufferManager = new BufferManagerWebGPU(this, !toggleBitset[TOGGLE.BUFFERMAPPINGASYNC]);
            
                // JavaScript Performance Monitor
                this._statsFPS = await statsjsModule();
                this._statsFrameTime = await statsjsModule();
            } catch (e) {
                reject("Unable initialize the WebGPU context " + e)
                return false;
            }
    
            resolve(true);
        });
    }

    protected _initAvailableToggleBitset(): void {
        this._availableToggleBitset[TOGGLE.ENABLEMSAAx4]              = true;
        this._availableToggleBitset[TOGGLE.ENABLEINSTANCEDDRAWS]      = true;
        this._availableToggleBitset[TOGGLE.ENABLEDYNAMICBUFFEROFFSET] = false; // Not supported ?
        this._availableToggleBitset[TOGGLE.DISCRETEGPU]               = true;
        this._availableToggleBitset[TOGGLE.INTEGRATEDGPU]             = true;
        this._availableToggleBitset[TOGGLE.ENABLEFULLSCREENMODE]      = true;
        this._availableToggleBitset[TOGGLE.BUFFERMAPPINGASYNC]        = false; // Not yet finished
        this._availableToggleBitset[TOGGLE.TURNOFFVSYNC]              = true;
        this._availableToggleBitset[TOGGLE.DISABLED3D12RENDERPASS]    = true;
        this._availableToggleBitset[TOGGLE.DISABLEWEBGPUVALIDATION]   = true;
        this._availableToggleBitset[TOGGLE.SIMULATINGFISHCOMEANDGO]   = true;
    }

    private _syncClientSize(): void {
        const defaultWidth = this._canvas.offsetWidth * window.devicePixelRatio;
        const defaultHeight = this._canvas.offsetHeight * window.devicePixelRatio;
        // Extend canvas size
        if (this._enableFullScreenMode) {
            this._canvas.width = window.innerWidth || defaultWidth;
            this._canvas.height = window.innerHeight || defaultHeight;
        }
        else {
            this._canvas.width = defaultWidth;
            this._canvas.height = defaultHeight;
        }
        this.setWindowSize(this._canvas.width, this._canvas.height);
    }

    private _framebufferResizeCallback(): void {
        this._isSwapchainOutOfDate = true;
    }

    public createTextureWebGPU(name: string, urls: string | string[]): Promise<Nullable<Texture>> {
        return Promise.resolve().then(async () => {
            const texture: Texture = new TextureWebGPU(this, name, urls);
            await texture.loadTexture();
            return texture;
        });
    }

    public createTexture(descriptor: GPUTextureDescriptor): GPUTexture {
        return this.device.createTexture(descriptor);
    }

    public createSampler(descriptor: GPUSamplerDescriptor): GPUSampler {
        return this.device.createSampler(descriptor);
    }

    public createBufferFromData(pixels: Float32Array | Uint16Array, size: size_t, usage: GPUBufferUsageFlags): GPUBuffer {
        const buffer: GPUBuffer = this.createBuffer(size, usage | GPUBufferUsage.COPY_DST);

        this.setBufferData(buffer, 0, size, pixels);
        return buffer;
    }

    public createBufferCopyView(buffer: GPUBuffer, offset: uint32_t, bytesPerRow: uint32_t, rowsPerImage: uint32_t): GPUBufferCopyView {
        const bufferCopyView: GPUBufferCopyView = {
            buffer: buffer,
            offset: offset,
            bytesPerRow: bytesPerRow,
            rowsPerImage: rowsPerImage
        };

        return bufferCopyView;
    }

    public createTextureCopyView(texture: GPUTexture, level: uint32_t, slice: uint32_t, origin: GPUOrigin3D): GPUTextureCopyView {
        const textureCopyView: GPUTextureCopyView = {
            texture: texture,
            mipLevel: level,
            arrayLayer: slice,
            origin: origin
        };

        return textureCopyView;
    }

    public copyBufferToTexture(bufferCopyView: GPUBufferCopyView, textureCopyView: GPUTextureCopyView, ext3D: GPUExtent3D): GPUCommandBuffer {
        const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
        encoder.copyBufferToTexture(bufferCopyView, textureCopyView, ext3D);
        const copy: GPUCommandBuffer = encoder.finish();

        return copy;
    }

    public copyBufferToBuffer(srcBuffer: GPUBuffer, srcOffset: size_t, destBuffer: GPUBuffer, destOffset: size_t, size: size_t): GPUCommandBuffer {
        const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
        encoder.copyBufferToBuffer(srcBuffer, srcOffset, destBuffer, destOffset, size);
        const copy: GPUCommandBuffer = encoder.finish();

        return copy;
    }

    public createShaderModule(stage: SingleShaderStage, shaderSourceGLSL: string): GPUShaderModule {
        const shaderType: string = (stage == SingleShaderStage.Vertex) ? "vertex" :
                                   (stage == SingleShaderStage.Fragment) ? "fragment" : "compute";
        const shaderModule: GPUShaderModule = this.device.createShaderModule(
            <GPUShaderModuleDescriptor> {
                code: this._glslang.compileGLSL(shaderSourceGLSL, shaderType),
                // @ts-ignore
                source: shaderSourceGLSL,
                transform: source => this._glslang.compileGLSL(source, shaderType),
            }
        );
        return shaderModule;
    }

    public makeBindGroupLayout(bindGroupLayoutdescriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout {
        return this.device.createBindGroupLayout(bindGroupLayoutdescriptor);
    }

    public makeBasicPipelineLayout(pipelineLayoutDescriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout {
        return this.device.createPipelineLayout(pipelineLayoutDescriptor);
    }

    public createRenderPipeline(pipelineLayout: GPUPipelineLayout, programWebGPU: ProgramWebGPU,
                                vertexStateDescriptor: Nullable<ComboVertexStateDescriptor>,
                                enableBlend: boolean): GPURenderPipeline {
        const vsModule: Nullable<GPUShaderModule> = programWebGPU.vertexShaderModule;
        const fsModule: Nullable<GPUShaderModule> = programWebGPU.fragmentShaderModule
    
        const blendDescriptor: GPUBlendDescriptor = {
            operation: "add",
            srcFactor: enableBlend ? "src-alpha" : "one",
            dstFactor: enableBlend ? "one-minus-src-alpha" : "zero"
        };

        const colorStateDescriptor: GPUColorStateDescriptor = {
            format: this._preferredSwapChainFormat,
            colorBlend: blendDescriptor,
            alphaBlend: blendDescriptor,
            writeMask: GPUColorWrite.ALL
        };

        const rasterizationState: GPURasterizationStateDescriptor = {
            frontFace: "ccw",
            cullMode: "back",
            depthBias: 0,
            depthBiasSlopeScale: 0.0,
            depthBiasClamp: 0.0
        };

        // test
        const descriptor: ComboRenderPipelineDescriptor = new ComboRenderPipelineDescriptor(this.device);
        descriptor.layout                               = pipelineLayout;
        descriptor.vertexStage.module                   = vsModule;
        descriptor.fragmentStage.module                 = fsModule;
        descriptor.vertexState                          = vertexStateDescriptor;
        descriptor.depthStencilState                    = descriptor.cDepthStencilState;
        descriptor.cDepthStencilState.format            = "depth24plus-stencil8";
        descriptor.colorStates[0]                       = colorStateDescriptor;
        descriptor.colorStates[0].format                = this._preferredSwapChainFormat;
        descriptor.cDepthStencilState.depthWriteEnabled = true;
        descriptor.cDepthStencilState.depthCompare      = "less";
        descriptor.primitiveTopology                    = "triangle-list"
        descriptor.sampleCount                          = this._enableMSAA ? 4 : 1;
        descriptor.rasterizationState                   = rasterizationState;
        
        const pipeline: GPURenderPipeline = this.device.createRenderPipeline(descriptor);

        return pipeline;
    }

    public createMultisampledRenderTargetView(): GPUTextureView {
        const descriptor: GPUTextureDescriptor = {
            dimension: "2d",
            size: <GPUExtent3DDict> {
                width: this._clientWidth,
                height: this._clientHeight,
                depth: 1
            },
            sampleCount: 4,
            format: this._preferredSwapChainFormat,
            mipLevelCount: 1,
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT
        };
        const multisampledRenderTargetView = this.device.createTexture(descriptor);
        return multisampledRenderTargetView.createView();
    }

    public createDepthStencilView(): GPUTextureView {
        const descriptor: GPUTextureDescriptor = {
            dimension: "2d",
            size: <GPUExtent3DDict> {
                width: this._clientWidth,
                height: this._clientHeight,
                depth: 1
            },
            sampleCount: this._enableMSAA ? 4 : 1,
            format: "depth24plus-stencil8",
            mipLevelCount: 1,
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_DST
        };
        const depthStencilTexture = this.device.createTexture(descriptor);
        return depthStencilTexture.createView();
    }

    public createBuffer(size: uint32_t, bit: GPUBufferUsageFlags): GPUBuffer {
        const descriptor: GPUBufferDescriptor = {
            size: size,
            usage: bit
        }

        return this.device.createBuffer(descriptor);
    }

    public setBufferData(buffer: GPUBuffer, start: uint32_t, size: uint32_t, pixels: Float32Array | Uint16Array): void {
        let [resultBuffer, resultData] = this.createBufferMapped(GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC, size);
    
        const writeArray = pixels instanceof Uint16Array ? new Uint16Array(resultData) : new Float32Array(resultData);
        writeArray.set(pixels);
        resultBuffer.unmap();
        
        const command: GPUCommandBuffer = this.copyBufferToBuffer(resultBuffer, 0, buffer, 0, size);
        this.commandBuffers.push(command);
    }

    public makeBindGroup(bindGroupDescriptor: GPUBindGroupDescriptor): GPUBindGroup {
        return this.device.createBindGroup(bindGroupDescriptor);
    }

    public initGeneralResources(aquarium: Nullable<Aquarium>): void {
        // Initialize general uniform buffers
        this.groupLayoutGeneral = this.makeBindGroupLayout(
            <GPUBindGroupLayoutDescriptor> {
                entries: <GPUBindGroupLayoutEntry[]> [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "uniform-buffer"
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "uniform-buffer"
                    }
                ]
            }
        );

        this._lightBuffer = this.createBufferFromData(aquarium.lightUniforms.data, LightUniforms.byteSize,
                                                      GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);
        this._fogBuffer = this.createBufferFromData(aquarium.fogUniforms.data, FogUniforms.byteSize,
                                                    GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        this.bindGroupGeneral = this.makeBindGroup(
            <GPUBindGroupDescriptor> {
                layout: this.groupLayoutGeneral,
                entries: <GPUBindGroupEntry[]> [
                    {
                        binding: 0,
                        resource: <GPUBufferBinding> {
                            buffer: this._lightBuffer,
                            offset: 0,
                        }
                    },
                    {
                        binding: 1,
                        resource: <GPUBufferBinding> {
                            buffer: this._fogBuffer,
                            offset: 0,
                        }
                    }
                ]
            }
        );

        this.setBufferData(this._lightBuffer, 0, LightUniforms.byteSize, aquarium.lightUniforms.data);
        this.setBufferData(this._fogBuffer, 0, FogUniforms.byteSize, aquarium.fogUniforms.data);

        // Initialize world uniform buffers
        this.groupLayoutWorld = this.makeBindGroupLayout(
            <GPUBindGroupLayoutDescriptor> {
                entries: <GPUBindGroupLayoutEntry[]> [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        type: "uniform-buffer"
                    }
                ]
            }
        );

        this._lightWorldPositionBuffer = this.createBufferFromData(
            aquarium.lightWorldPositionUniform.data,
            this.calcConstantBufferByteSize(LightWorldPositionUniform.byteSize),
            GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        this.bindGroupWorld = this.makeBindGroup(
            <GPUBindGroupDescriptor> {
                layout: this.groupLayoutWorld,
                entries: <GPUBindGroupEntry[]> [
                    {
                        binding: 0,
                        resource: <GPUBufferBinding> {
                            buffer: this._lightWorldPositionBuffer,
                            offset: 0,
                        }
                    }
                ]
            }
        );

        const enableDynamicBufferOffset: boolean = aquarium.toggleBitset[TOGGLE.ENABLEDYNAMICBUFFEROFFSET];
        this.groupLayoutFishPer = this.makeBindGroupLayout(
            <GPUBindGroupLayoutDescriptor> {
                entries: <GPUBindGroupLayoutEntry[]> [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        type: "uniform-buffer",
                        hasDynamicOffset: enableDynamicBufferOffset ? true : undefined,
                    }
                ]
            }
        );

        this.reallocResource(aquarium.preFishCount, aquarium.curFishCount, enableDynamicBufferOffset);
    }

    public updateWorldlUniforms(aquarium: Nullable<Aquarium>) {
        this.updateBufferData(this._lightWorldPositionBuffer, aquarium.lightWorldPositionUniform.data,
                              this.calcConstantBufferByteSize(LightWorldPositionUniform.byteSize));
    }

    public createBufferWebGPU(numComponents: int, buf: Float32Array | Uint16Array, isIndex: boolean): Nullable<Buffer> {
        const buffer: Buffer = new BufferWebGPU(this, buf.length, numComponents, buf, isIndex);

        return buffer;
    }

    public createProgram(vsId: string, fsId: string): Nullable<Program> {
        const program: ProgramWebGPU = new ProgramWebGPU(this, vsId, fsId);

        return program;
    }

    /**
     * Submit commands of the frame.
     */
    public doFlush(toggleBitset: Array<boolean>): void {
        this._renderPass.endPass();

        this._bufferManager.flush();

        const cmd: GPUCommandBuffer = this._commandEncoder.finish();
        this.commandBuffers.push(cmd);

        this.flush();
    }

    public flush(): void {
        this.queue.submit(this.commandBuffers);
        this.commandBuffers.length = 0
    }

    public preFrame(): void {

        if (this._isSwapchainOutOfDate) {
            this._syncClientSize();
            if (this._enableMSAA) {
                this._sceneRenderTargetView = this.createMultisampledRenderTargetView();
            }
            this._sceneDepthStencilView = this.createDepthStencilView();
            this._isSwapchainOutOfDate = false;
        }

        this._commandEncoder = this.device.createCommandEncoder();
        this._backbufferView = this._swapChain.getCurrentTexture().createView();

        if (this._enableMSAA) {
            // If MSAA is enabled, we render to a multisampled texture and then resolve to the backbuffer
            this._renderPassDescriptor = new ComboRenderPassDescriptor([this._sceneRenderTargetView], this._sceneDepthStencilView);
            this._renderPassDescriptor.cColorAttachments[0].resolveTarget = this._backbufferView;
            this._renderPassDescriptor.cColorAttachments[0].storeOp       = "clear";
            this._renderPassDescriptor.cColorAttachments[0].loadValue     = <GPUColorDict> {r: 0.0, g: 0.8, b: 1.0, a: 0.0};
            this._renderPassDescriptor.colorAttachmentCount               = 1;
        }
        else {
            // When MSAA is off, we render directly to the backbuffer
            this._renderPassDescriptor = new ComboRenderPassDescriptor([this._backbufferView], this._sceneDepthStencilView);
            this._renderPassDescriptor.cColorAttachments[0].storeOp   = "store";
            this._renderPassDescriptor.cColorAttachments[0].loadValue = <GPUColorDict> {r: 0.0, g: 0.8, b: 1.0, a: 0.0};
            this._renderPassDescriptor.colorAttachmentCount           = 1;
        }

        this._renderPass = this._commandEncoder.beginRenderPass(this._renderPassDescriptor);
    }

    public updateFPS(fpsTimer: FPSTimer, fisCountGetter: () => int, fisCountSetter: (fishCount: int) => void, toggleBitset: Array<boolean>): void {
        if (this._disableControlPanel) {
            return;
        }
        
        this.renderGUI(this._canvas, fpsTimer, fisCountGetter, fisCountSetter, toggleBitset);
    }

    public showFPS(canvas?: HTMLCanvasElement): void {
        if (this._disableControlPanel) {
            return;
        }

        super.showFPS(this._canvas);
    }

    public createModel(aquarium: Nullable<Aquarium>, type: MODELGROUP, name: MODELNAME, blend: boolean): Nullable<Model> {
        let model: Nullable<Model> = null;
        switch(type) {
            case MODELGROUP.FISH:
                model = new FishModelWebGPU(this, aquarium, type, name, blend);
                break;
            case MODELGROUP.FISHINSTANCEDDRAW:
                model = new FishModelInstancedDrawWebGPU(this, aquarium, type, name, blend);
                break;
            case MODELGROUP.GENERIC:
                model = new GenericModelWebGPU(this, aquarium, type, name, blend);
                break;
            case MODELGROUP.INNER:
                model = new InnerModelWebGPU(this, aquarium, type, name, blend);
                break;
            case MODELGROUP.SEAWEED:
                model = new SeaweedModelWebGPU(this, aquarium, type, name, blend);
                break;
            case MODELGROUP.OUTSIDE:
                model = new OutsideModelWebGPU(this, aquarium, type, name, blend);
                break;
            default:
                model = null;
                console.error("Can not create model type: " + type);
        }

        return model;
    }

    public reallocResource(preTotalInstance: int, curTotalInstance: int, enableDynamicBufferOffset: boolean): void {
        this._preTotalInstance          = preTotalInstance;
        this._curTotalInstance          = curTotalInstance;
        this._enableDynamicBufferOffset = enableDynamicBufferOffset;

        if (curTotalInstance === 0) {
            return;
        }

        // If current fish number > pre fish number, allocate a new bigger buffer.
        // If current fish number <= prefish number, do not allocate a new one.
        if (preTotalInstance >= curTotalInstance) {
            return;
        }

        this._destroyFishResource();

        this.fishPers = BuildArray(curTotalInstance, () => new FishPerWithPadding());

        if (enableDynamicBufferOffset) {
            this.bindGroupFishPers = Array.from<GPUBindGroup>([null]);
        }
        else {
            this.bindGroupFishPers = BuildArray(curTotalInstance, () => null);
        }

        const size: size_t  = this.calcConstantBufferByteSize(FishPerWithPadding.byteSize * curTotalInstance);
        this.fishPersBuffer = this.createBuffer(size, GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        if (enableDynamicBufferOffset) {
            this.bindGroupFishPers[0] = this.makeBindGroup(
                <GPUBindGroupDescriptor> {
                    layout: this.groupLayoutFishPer,
                    entries: <GPUBindGroupEntry[]> [
                        {
                            binding: 0,
                            resource: <GPUBufferBinding> {
                                buffer: this.fishPersBuffer,
                                offset: 0
                            }
                        }
                    ]
                }
            );
        }
        else {
            for (let i: int = 0; i < curTotalInstance; ++i) {
                this.bindGroupFishPers[i] = this.makeBindGroup(
                    <GPUBindGroupDescriptor> {
                        layout: this.groupLayoutFishPer,
                        entries: <GPUBindGroupEntry[]> [
                            {
                                binding: 0,
                                resource: <GPUBufferBinding> {
                                    buffer: this.fishPersBuffer,
                                    offset: this.calcConstantBufferByteSize(FishPerWithPadding.byteSize * i)
                                }
                            }
                        ]
                    }
                );
            }
        }
    }

    public createBufferMapped(usage: GPUBufferUsageFlags, size: uint32_t): [GPUBuffer, ArrayBuffer] {
        const descriptor: GPUBufferDescriptor = {
            size: size,
            usage: usage
        }

        const result: [GPUBuffer, ArrayBuffer] = this.device.createBufferMapped(descriptor);
        ASSERT(result[1].byteLength === size, "Invalid buffer size.");
        return result;
    }

    public get renderPass(): GPURenderPassEncoder {
        return this._renderPass;
    }

    public waitABit(): void {

    }

    public createCommandEncoder(): GPUCommandEncoder {
        return this.device.createCommandEncoder();
    }

    public updateAllFishData(): void {
        const size: size_t = this.calcConstantBufferByteSize(FishPerWithPadding.byteSize * this._curTotalInstance);
        let fishPersData: Array<float> = [];
        for (let i: size_t = 0; i < this._curTotalInstance; ++i) {
            fishPersData = fishPersData.concat(this.fishPers[i].getAsArray());
        }
        this.updateBufferData(this.fishPersBuffer, new Float32Array(fishPersData), size);
    }

    public updateBufferData(buffer: GPUBuffer, pixel: Float32Array | Uint16Array, size: size_t): void {
        let offset: size_t = 0;
        const result = this._bufferManager.allocate(size, offset);
        
        const ringBuffer: Nullable<RingBufferWebGPU> = result.buffer;
        offset                                       = result.offset;

        if (ringBuffer === null) {
            console.error("Memory upper limit.");
            return;
        }

        ringBuffer.push(this._bufferManager.encoder, buffer, offset, 0, pixel, size);
    }

    private _destroyFishResource(): void {
        this.fishPersBuffer = null;

        if (this.fishPers.length > 0) {
            this.fishPers.length = 0;
        }
        if (this._enableDynamicBufferOffset) {
            if (this.bindGroupFishPers !== null) {
                if (this.bindGroupFishPers[0] !== null) {
                    this.bindGroupFishPers[0] = null;
                }
            }
        }
        else {
            if (this.bindGroupFishPers !== null) {
                for (let i: int = 0; i < this._preTotalInstance; i++) {
                    if (this.bindGroupFishPers[i] !== null) {
                        this.bindGroupFishPers[i] = null;
                    }
                }
            }
        }

        this.bindGroupFishPers.length = 0;

        this._bufferManager.destroyBufferPool();
    }

    public calcConstantBufferByteSize(byteSize: size_t): size_t {
        return (byteSize + 255) & ~255;
    }

}