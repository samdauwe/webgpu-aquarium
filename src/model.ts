/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

import { Nullable, int, float, FloatArray, uint32_t, MergeTypedArrays, size_t, BuildArray } from "./types";
import { MODELNAME, MODELGROUP, TOGGLE, Aquarium, Fish, fishTable } from "./aquarium";
import { Buffer, BufferWebGPU } from "./buffer"
import { Context, ContextWebGPU } from "./context"
import { Program, ProgramWebGPU } from "./program";
import { Texture, TextureWebGPU } from "./texture";
import { FishPer, FishVertexUniforms, InnerUniforms, LightFactorUniforms, SeaweedPer, WorldUniformPer, WorldUniforms } from "./uniforms"
import { ComboVertexStateDescriptor } from "./utils"


/**
 * Defines the base Class Model for all of the models.
 * Contains programs, textures and buffers info of models.
 * Apply program for its model. Update uniforms, textures and buffers for each frame.
 */
export class Model {

    public worldmatrices: Array<FloatArray> = new Array<FloatArray>();
    public textureMap: Record<string, Nullable<Texture>> = {};
    public bufferMap: Record<string, Nullable<Buffer>> = {};

    protected _program: Nullable<Program> = null;
    protected _blend: boolean;
    protected _name: MODELNAME;

    constructor(type?: MODELGROUP, name?: MODELNAME, blend?: boolean) {
        this._blend = blend || false;
        this._name = name || MODELNAME.MODELMAX;
    }

    public dispose(): void {
        for (let k in this.bufferMap) {
            if (this.bufferMap[k] !== null) {
                delete this.bufferMap[k];
            }
        }
        this.bufferMap = {};
    }

    public set program(program: Nullable<Program>) {
        this._program = program;
    }

    public prepareForDraw(): void { }
    public updatePerInstanceUniforms(worldUniforms: WorldUniforms): void { }
    public draw(): void { }
    public init(): void { }
}

/**
 * Defines the fish model. Updates fish specific uniforms.
 */
export class FishModel extends Model {

    protected _preInstance: int = 0;
    protected _curInstance: int = 0;
    protected _fishPerOffset: int = 0;

    protected _aquarium: Nullable<Aquarium> = null;

    constructor(type: MODELGROUP, name: MODELNAME, blend: boolean, aquarium: Aquarium) {
        super(type, name, blend);
        this._aquarium = aquarium;
    }

    public updateFishPerUniforms(x: float, y: float, z: float,
                                 nextX: float, nextY: float, nextZ: float,
                                 scale: float, time: float, index: int): void { }
    
    
    public prepareForDraw(): void {
        this._fishPerOffset = 0;
        for (let i = 0; i < this._name - MODELNAME.MODELSMALLFISHA; ++i) {
            const fishInfo: Fish = fishTable[i];
            this._fishPerOffset += this._aquarium.fishCount[fishInfo.modelName - MODELNAME.MODELSMALLFISHA];
        }

        const fishInfo: Fish = fishTable[this._name - MODELNAME.MODELSMALLFISHA];
        this._curInstance    = this._aquarium.fishCount[fishInfo.modelName - MODELNAME.MODELSMALLFISHA];
    }

}

/**
 * Defines the seaweed model.
 */
export class SeaweedModel extends Model {

    constructor(type: MODELGROUP, name: MODELNAME, blend: boolean) {
        super(type, name, blend);
    }

    public updateSeaweedModelTime(time: float) { }

}

/**
 * Defines the generic model of WebGPU.
 */
export class GenericModelWebGPU extends Model {

    public diffuseTexture: Nullable<TextureWebGPU>    = null;
    public normalTexture: Nullable<TextureWebGPU>     = null;
    public reflectionTexture: Nullable<TextureWebGPU> = null;
    public skyboxTexture: Nullable<TextureWebGPU>     = null;

    public positionBuffer: Nullable<BufferWebGPU> = null;
    public normalBuffer: Nullable<BufferWebGPU>   = null;
    public texCoordBuffer: Nullable<BufferWebGPU> = null;
    public tangentBuffer: Nullable<BufferWebGPU>  = null;
    public biNormalBuffer: Nullable<BufferWebGPU> = null;

    public indicesBuffer: Nullable<BufferWebGPU>  = null;

    public lightFactorUniforms: Nullable<LightFactorUniforms> = new LightFactorUniforms();
    public worldUniformPer: Nullable<WorldUniformPer> = new WorldUniformPer();

    protected _vertexStateDescriptor: Nullable<ComboVertexStateDescriptor> = null;
    protected _pipeline: GPURenderPipeline;

    protected _groupLayoutModel:GPUBindGroupLayout;
    protected _groupLayoutPer: GPUBindGroupLayout;
    protected _pipelineLayout: GPUPipelineLayout;

    protected _bindGroupModel: GPUBindGroup;
    protected _bindGroupPer: GPUBindGroup;

    protected _lightFactorBuffer: GPUBuffer;
    protected _worldBuffer: GPUBuffer;

    protected _contextWebGPU: Nullable<ContextWebGPU> = null;
    protected _programWebGPU: Nullable<ProgramWebGPU> = null;

    protected _instance: int = 0;

    constructor(context: Nullable<Context>, aquarium: Nullable<Aquarium>, type: MODELGROUP, name: MODELNAME, blend: boolean) {
        super(type, name, blend);

        this._contextWebGPU = context as Nullable<ContextWebGPU>;
        this._vertexStateDescriptor = new ComboVertexStateDescriptor();

        this.lightFactorUniforms.shininess      = 50.0;
        this.lightFactorUniforms.specularFactor = 1.0;
    }

    public dispose(): void {
        this._pipeline          = null;
        this._groupLayoutModel  = null;
        this._groupLayoutPer    = null;
        this._pipelineLayout    = null;
        this._bindGroupModel    = null;
        this._bindGroupPer      = null;
        this._lightFactorBuffer = null;
        this._worldBuffer       = null;
    }

    public init(): void {
        this._programWebGPU = this._program as Nullable<ProgramWebGPU>;

        this.diffuseTexture    = this.textureMap["diffuse"] as TextureWebGPU;
        this.normalTexture     = this.textureMap["normalMap"] as TextureWebGPU;
        this.reflectionTexture = this.textureMap["reflectionMap"] as TextureWebGPU;
        this.skyboxTexture     = this.textureMap["skybox"] as TextureWebGPU;

        this.positionBuffer = this.bufferMap["position"] as BufferWebGPU;
        this.normalBuffer   = this.bufferMap["normal"] as BufferWebGPU;
        this.texCoordBuffer = this.bufferMap["texCoord"] as BufferWebGPU;
        this.tangentBuffer  = this.bufferMap["tangent"] as BufferWebGPU;
        this.biNormalBuffer = this.bufferMap["binormal"] as BufferWebGPU;
        this.indicesBuffer  = this.bufferMap["indices"] as BufferWebGPU;

        // Generic models use reflection, normal or diffuse shaders, of which groupLayouts are
        // different in texture binding.  MODELGLOBEBASE use diffuse shader though it contains
        // normal and reflection textures.
        if (this.normalTexture && this._name !== MODELNAME.MODELGLOBEBASE) {
            this._vertexStateDescriptor.cVertexBuffers[0].arrayStride = this.positionBuffer.dataSize;
            this._vertexStateDescriptor.cAttributes[0].format         = "float3";
            this._vertexStateDescriptor.cAttributes[0].shaderLocation = 0;
            this._vertexStateDescriptor.cAttributes[0].offset         = 0;
            this._vertexStateDescriptor.cVertexBuffers[0].attributes  = [this._vertexStateDescriptor.cAttributes[0]];
            
            this._vertexStateDescriptor.cVertexBuffers[1].arrayStride = this.normalBuffer.dataSize;
            this._vertexStateDescriptor.cAttributes[1].format         = "float3";
            this._vertexStateDescriptor.cAttributes[1].shaderLocation = 1;
            this._vertexStateDescriptor.cAttributes[1].offset         = 0;
            this._vertexStateDescriptor.cVertexBuffers[1].attributes  = [this._vertexStateDescriptor.cAttributes[1]];
            
            this._vertexStateDescriptor.cVertexBuffers[2].arrayStride = this.texCoordBuffer.dataSize;
            this._vertexStateDescriptor.cAttributes[2].format         = "float2";
            this._vertexStateDescriptor.cAttributes[2].shaderLocation = 2;
            this._vertexStateDescriptor.cAttributes[2].offset         = 0;
            this._vertexStateDescriptor.cVertexBuffers[2].attributes  = [this._vertexStateDescriptor.cAttributes[2]];
            
            this._vertexStateDescriptor.cVertexBuffers[3].arrayStride = this.tangentBuffer.dataSize;
            this._vertexStateDescriptor.cAttributes[3].format         = "float3";
            this._vertexStateDescriptor.cAttributes[3].shaderLocation = 3;
            this._vertexStateDescriptor.cAttributes[3].offset         = 0;
            this._vertexStateDescriptor.cVertexBuffers[3].attributes  = [this._vertexStateDescriptor.cAttributes[3]];
            
            this._vertexStateDescriptor.cVertexBuffers[4].arrayStride = this.biNormalBuffer.dataSize;
            this._vertexStateDescriptor.cAttributes[4].format         = "float3";
            this._vertexStateDescriptor.cAttributes[4].shaderLocation = 4;
            this._vertexStateDescriptor.cAttributes[4].offset         = 0;
            this._vertexStateDescriptor.cVertexBuffers[4].attributes  = [this._vertexStateDescriptor.cAttributes[4]];
            
            this._vertexStateDescriptor.vertexBufferCount             = 5;
            this._vertexStateDescriptor.indexFormat                   = "uint16";
        }
        else {
            this._vertexStateDescriptor.cVertexBuffers[0].arrayStride = this.positionBuffer.dataSize;
            this._vertexStateDescriptor.cAttributes[0].format         = "float3";
            this._vertexStateDescriptor.cAttributes[0].shaderLocation = 0;
            this._vertexStateDescriptor.cAttributes[0].offset         = 0;
            this._vertexStateDescriptor.cVertexBuffers[0].attributes  = [this._vertexStateDescriptor.cAttributes[0]];

            this._vertexStateDescriptor.cVertexBuffers[1].arrayStride = this.normalBuffer.dataSize;
            this._vertexStateDescriptor.cAttributes[1].format         = "float3";
            this._vertexStateDescriptor.cAttributes[1].shaderLocation = 1;
            this._vertexStateDescriptor.cAttributes[1].offset         = 0;
            this._vertexStateDescriptor.cVertexBuffers[1].attributes  = [this._vertexStateDescriptor.cAttributes[1]];

            this._vertexStateDescriptor.cVertexBuffers[2].arrayStride = this.texCoordBuffer.dataSize;
            this._vertexStateDescriptor.cAttributes[2].format         = "float2";
            this._vertexStateDescriptor.cAttributes[2].shaderLocation = 2;
            this._vertexStateDescriptor.cAttributes[2].offset         = 0;
            this._vertexStateDescriptor.cVertexBuffers[2].attributes  = [this._vertexStateDescriptor.cAttributes[2]];

            this._vertexStateDescriptor.vertexBufferCount             = 3;
            this._vertexStateDescriptor.indexFormat                   = "uint16";
        }

        if (this.skyboxTexture && this.reflectionTexture && this._name !== MODELNAME.MODELGLOBEBASE) {
            this._groupLayoutModel = this._contextWebGPU.makeBindGroupLayout(
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
                            type: "sampler"
                        },
                        {
                            binding: 2,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampler"
                        },
                        {
                            binding: 3,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension: "2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 4,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 5,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 6,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension: "cube",
                            textureComponentType: "float"
                        }
                    ]
                }
            );
        }
        else if (this.normalTexture && this._name != MODELNAME.MODELGLOBEBASE) {
            this._groupLayoutModel = this._contextWebGPU.makeBindGroupLayout(
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
                            type: "sampler"
                        },
                        {
                            binding: 2,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 3,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        }
                    ]
                }
            );
        }
        else {
            this._groupLayoutModel = this._contextWebGPU.makeBindGroupLayout(
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
                            type: "sampler"
                        },
                        {
                            binding: 2,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        }
                    ]
                }
            );
        }

        this._groupLayoutPer = this._contextWebGPU.makeBindGroupLayout(
            <GPUBindGroupLayoutDescriptor> {
                entries: <GPUBindGroupLayoutEntry[]> [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        type: "uniform-buffer"
                    }
                ]
            }
        )

        this._pipelineLayout = this._contextWebGPU.makeBasicPipelineLayout(
            <GPUPipelineLayoutDescriptor> {
                bindGroupLayouts: <GPUBindGroupLayout[]> [
                    this._contextWebGPU.groupLayoutGeneral,
                    this._contextWebGPU.groupLayoutWorld,
                    this._groupLayoutModel,
                    this._groupLayoutPer,
                ]
            }
        );

        this._pipeline = this._contextWebGPU.createRenderPipeline(
            this._pipelineLayout,
            this._programWebGPU,
            this._vertexStateDescriptor,
            this._blend
        );

        this._lightFactorBuffer =
            this._contextWebGPU.createBufferFromData(this.lightFactorUniforms.data,
                                                     LightFactorUniforms.byteSize,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        this._worldBuffer =
            this._contextWebGPU.createBufferFromData(this.worldUniformPer.data,
                                                     this.worldUniformPer.byteSize,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);


        // Generic models use reflection, normal or diffuse shaders, of which grouplayouts are
        // different in texture binding. MODELGLOBEBASE use diffuse shader though it contains
        // normal and reflection textures.
        if (this.skyboxTexture && this.reflectionTexture && this._name !== MODELNAME.MODELGLOBEBASE) {
            this._bindGroupModel = this._contextWebGPU.makeBindGroup(
                <GPUBindGroupDescriptor> {
                    layout: this._groupLayoutModel,
                    entries: <GPUBindGroupEntry[]> [
                        {
                            binding: 0,
                            resource: <GPUBufferBinding> {
                                buffer: this._lightFactorBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 1,
                            resource: this.reflectionTexture.sampler
                        },
                        {
                            binding: 2,
                            resource: this.skyboxTexture.sampler
                        },
                        {
                            binding: 3,
                            resource: this.diffuseTexture.textureView
                        },
                        {
                            binding: 4,
                            resource: this.normalTexture.textureView
                        },
                        {
                            binding: 5,
                            resource: this.reflectionTexture.textureView
                        },
                        {
                            binding: 6,
                            resource: this.skyboxTexture.textureView
                        }
                    ]
                }
            );
        }
        else if (this.normalTexture && this._name !== MODELNAME.MODELGLOBEBASE) {
            this._bindGroupModel = this._contextWebGPU.makeBindGroup(
                <GPUBindGroupDescriptor> {
                    layout: this._groupLayoutModel,
                    entries: <GPUBindGroupEntry[]> [
                        {
                            binding: 0,
                            resource: <GPUBufferBinding> {
                                buffer: this._lightFactorBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 1,
                            resource: this.diffuseTexture.sampler
                        },
                        {
                            binding: 2,
                            resource: this.diffuseTexture.textureView
                        },
                        {
                            binding: 3,
                            resource: this.normalTexture.textureView
                        }
                    ]
                }
            );
        }
        else {
            this._bindGroupModel = this._contextWebGPU.makeBindGroup(
                <GPUBindGroupDescriptor> {
                    layout: this._groupLayoutModel,
                    entries: <GPUBindGroupEntry[]> [
                        {
                            binding: 0,
                            resource: <GPUBufferBinding> {
                                buffer: this._lightFactorBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 1,
                            resource: this.diffuseTexture.sampler
                        },
                        {
                            binding: 2,
                            resource: this.diffuseTexture.textureView
                        }
                    ]
                }
            );
        }

        this._bindGroupPer = this._contextWebGPU.makeBindGroup(
            <GPUBindGroupDescriptor> {
                layout: this._groupLayoutPer,
                entries: <GPUBindGroupEntry[]> [
                    {
                        binding: 0,
                        resource: <GPUBufferBinding> {
                            buffer: this._worldBuffer,
                            offset: 0,
                        }
                    }
                ]
            }
        );

        this._contextWebGPU.setBufferData(this._lightFactorBuffer, 0, LightFactorUniforms.byteSize,
                                          this.lightFactorUniforms.data);
    }

    public prepareForDraw(): void {
        this._contextWebGPU.updateBufferData(this._worldBuffer, this.worldUniformPer.data, this.worldUniformPer.byteSize);
    }

    public draw(): void {
        const pass = this._contextWebGPU.renderPass;
        pass.setPipeline(this._pipeline);
        pass.setBindGroup(0, this._contextWebGPU.bindGroupGeneral);
        pass.setBindGroup(1, this._contextWebGPU.bindGroupWorld);
        pass.setBindGroup(2, this._bindGroupModel);
        pass.setBindGroup(3, this._bindGroupPer);
        pass.setVertexBuffer(0, this.positionBuffer.buffer);
        pass.setVertexBuffer(1, this.normalBuffer.buffer);
        pass.setVertexBuffer(2, this.texCoordBuffer.buffer);
        // diffuseShader doesn't have to input tangent buffer or binormal buffer.
        if (this.tangentBuffer && this.biNormalBuffer && this._name !== MODELNAME.MODELGLOBEBASE)
        {
            pass.setVertexBuffer(3, this.tangentBuffer.buffer);
            pass.setVertexBuffer(4, this.biNormalBuffer.buffer);
        }
        pass.setIndexBuffer(this.indicesBuffer.buffer, 0);
        pass.drawIndexed(this.indicesBuffer.totalComponents, this._instance, 0, 0, 0);
        this._instance = 0;
    }

    public updatePerInstanceUniforms(worldUniforms: WorldUniforms): void {
        this.worldUniformPer.worldUniforms[this._instance] = worldUniforms;

        this._instance++;
    }

}

/**
 * Defines the outside model of WebGPU.
 */
export class OutsideModelWebGPU extends GenericModelWebGPU {

    private _viewBuffer: GPUBuffer;

    constructor(context: Nullable<Context>, aquarium: Nullable<Aquarium>, type: MODELGROUP, name: MODELNAME, blend: boolean) {
        super(context, aquarium, type, name, blend);

        this.lightFactorUniforms.shininess      = 50.0;
        this.lightFactorUniforms.specularFactor = 1.0;
    }

    public dispose(): void {
        this._viewBuffer = null;
        super.dispose();
    }

    public init(): void {
        this._programWebGPU = this._program as Nullable<ProgramWebGPU>;

        this.diffuseTexture    = this.textureMap["diffuse"] as TextureWebGPU;
        this.normalTexture     = this.textureMap["normalMap"] as TextureWebGPU;
        this.reflectionTexture = this.textureMap["reflectionMap"] as TextureWebGPU;
        this.skyboxTexture     = this.textureMap["skybox"] as TextureWebGPU;

        this.positionBuffer = this.bufferMap["position"] as BufferWebGPU;
        this.normalBuffer   = this.bufferMap["normal"] as BufferWebGPU;
        this.texCoordBuffer = this.bufferMap["texCoord"] as BufferWebGPU;
        this.tangentBuffer  = this.bufferMap["tangent"] as BufferWebGPU;
        this.biNormalBuffer = this.bufferMap["binormal"] as BufferWebGPU;
        this.indicesBuffer  = this.bufferMap["indices"] as BufferWebGPU;
    
        this._vertexStateDescriptor.cVertexBuffers[0].arrayStride = this.positionBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[0].format         = "float3";
        this._vertexStateDescriptor.cAttributes[0].shaderLocation = 0;
        this._vertexStateDescriptor.cAttributes[0].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[0].attributes  = [this._vertexStateDescriptor.cAttributes[0]];
        
        this._vertexStateDescriptor.cVertexBuffers[1].arrayStride = this.normalBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[1].format         = "float3";
        this._vertexStateDescriptor.cAttributes[1].shaderLocation = 1;
        this._vertexStateDescriptor.cAttributes[1].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[1].attributes  = [this._vertexStateDescriptor.cAttributes[1]];
        
        this._vertexStateDescriptor.cVertexBuffers[2].arrayStride = this.texCoordBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[2].format         = "float2";
        this._vertexStateDescriptor.cAttributes[2].shaderLocation = 2;
        this._vertexStateDescriptor.cAttributes[2].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[2].attributes  = [this._vertexStateDescriptor.cAttributes[2]];
        
        this._vertexStateDescriptor.cVertexBuffers[3].arrayStride = this.tangentBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[3].format         = "float3";
        this._vertexStateDescriptor.cAttributes[3].shaderLocation = 3;
        this._vertexStateDescriptor.cAttributes[3].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[3].attributes  = [this._vertexStateDescriptor.cAttributes[3]];
        
        this._vertexStateDescriptor.cVertexBuffers[4].arrayStride = this.biNormalBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[4].format         = "float3";
        this._vertexStateDescriptor.cAttributes[4].shaderLocation = 4;
        this._vertexStateDescriptor.cAttributes[4].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[4].attributes  = [this._vertexStateDescriptor.cAttributes[4]];
        
        this._vertexStateDescriptor.vertexBufferCount             = 5;
        this._vertexStateDescriptor.indexFormat                   = "uint16";

        this._groupLayoutPer = this._contextWebGPU.makeBindGroupLayout(
            <GPUBindGroupLayoutDescriptor> {
                entries: <GPUBindGroupLayoutEntry[]> [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        type: "uniform-buffer"
                    }
                ]
            }
        )

        // Outside models use diffuse shaders.
        this._groupLayoutModel = this._contextWebGPU.makeBindGroupLayout(
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
                        type: "sampler"
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "sampled-texture"
                    }
                ]
            }      
        );
        
        this._pipelineLayout = this._contextWebGPU.makeBasicPipelineLayout(
            <GPUPipelineLayoutDescriptor> {
                bindGroupLayouts: <GPUBindGroupLayout[]> [
                    this._contextWebGPU.groupLayoutGeneral,
                    this._contextWebGPU.groupLayoutWorld,
                    this._groupLayoutModel,
                    this._groupLayoutPer,
                ]
            }
        );

        this._pipeline = this._contextWebGPU.createRenderPipeline(
            this._pipelineLayout,
            this._programWebGPU,
            this._vertexStateDescriptor,
            this._blend
        );

        this._lightFactorBuffer =
            this._contextWebGPU.createBufferFromData(this.lightFactorUniforms.data,
                                                     LightFactorUniforms.byteSize,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        this._viewBuffer =
            this._contextWebGPU.createBufferFromData(this.worldUniformPer.data,
                                                     this._contextWebGPU.calcConstantBufferByteSize(WorldUniforms.byteSize) * 20,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        this._bindGroupModel = this._contextWebGPU.makeBindGroup(
            <GPUBindGroupDescriptor> {
                layout: this._groupLayoutModel,
                entries: <GPUBindGroupEntry[]> [
                    {
                        binding: 0,
                        resource: <GPUBufferBinding> {
                            buffer: this._lightFactorBuffer,
                            offset: 0,
                        }
                    },
                    {
                        binding: 1,
                        resource: this.diffuseTexture.sampler
                    },
                    {
                        binding: 2,
                        resource: this.diffuseTexture.textureView
                    }
                ]
            }
        );

        this._bindGroupPer = this._contextWebGPU.makeBindGroup(
            <GPUBindGroupDescriptor> {
                layout: this._groupLayoutPer,
                entries: <GPUBindGroupEntry[]> [
                    {
                        binding: 0,
                        resource: <GPUBufferBinding> {
                            buffer: this._viewBuffer,
                            offset: 0,
                        }
                    }
                ]
            }
        );

        this._contextWebGPU.setBufferData(this._lightFactorBuffer, 0, LightFactorUniforms.byteSize,
                                          this.lightFactorUniforms.data);
    }

    public prepareForDraw(): void { }

    public draw(): void {
        const pass: GPURenderPassEncoder = this._contextWebGPU.renderPass;
        pass.setPipeline(this._pipeline);
        pass.setBindGroup(0, this._contextWebGPU.bindGroupGeneral);
        pass.setBindGroup(1, this._contextWebGPU.bindGroupWorld);
        pass.setBindGroup(2, this._bindGroupModel);
        pass.setBindGroup(3, this._bindGroupPer);
        pass.setVertexBuffer(0, this.positionBuffer.buffer);
        pass.setVertexBuffer(1, this.normalBuffer.buffer);
        pass.setVertexBuffer(2, this.texCoordBuffer.buffer);
        // diffuseShader doesn't have to input tangent buffer or binormal buffer.
        if (this.tangentBuffer && this.biNormalBuffer) {
            pass.setVertexBuffer(3, this.tangentBuffer.buffer);
            pass.setVertexBuffer(4, this.biNormalBuffer.buffer);
        }
        pass.setIndexBuffer(this.indicesBuffer.buffer, 0);
        pass.drawIndexed(this.indicesBuffer.totalComponents, 1, 0, 0, 0);
    }

    public updatePerInstanceUniforms(worldUniforms: WorldUniforms): void {
        this.worldUniformPer.worldUniforms[0] = worldUniforms;

        this._contextWebGPU.updateBufferData(this._viewBuffer, worldUniforms.data,
                                             this._contextWebGPU.calcConstantBufferByteSize(WorldUniforms.byteSize));
    }

}

/**
 * Defines the inner model of WebGPU.
 */
export class InnerModelWebGPU extends GenericModelWebGPU {

    public innerUniforms: Nullable<InnerUniforms> = new InnerUniforms();

    private _innerBuffer: GPUBuffer;
    private _viewBuffer: GPUBuffer;

    constructor(context: Nullable<Context>, aquarium: Nullable<Aquarium>, type: MODELGROUP, name: MODELNAME, blend: boolean) {
        super(context, aquarium, type, name, blend);

        this.innerUniforms.eta             = 1.0;
        this.innerUniforms.tankColorFudge  = 0.796;
        this.innerUniforms.refractionFudge = 3.0;
    }

    public dispose(): void {
        this._innerBuffer = null;
        this._viewBuffer = null;
        super.dispose();
    }

    public init(): void {
        this._programWebGPU = this._program as Nullable<ProgramWebGPU>;

        this.diffuseTexture    = this.textureMap["diffuse"] as TextureWebGPU;
        this.normalTexture     = this.textureMap["normalMap"] as TextureWebGPU;
        this.reflectionTexture = this.textureMap["reflectionMap"] as TextureWebGPU;
        this.skyboxTexture     = this.textureMap["skybox"] as TextureWebGPU;

        this.positionBuffer = this.bufferMap["position"] as BufferWebGPU;
        this.normalBuffer   = this.bufferMap["normal"] as BufferWebGPU;
        this.texCoordBuffer = this.bufferMap["texCoord"] as BufferWebGPU;
        this.tangentBuffer  = this.bufferMap["tangent"] as BufferWebGPU;
        this.biNormalBuffer = this.bufferMap["binormal"] as BufferWebGPU;
        this.indicesBuffer  = this.bufferMap["indices"] as BufferWebGPU;

        this._vertexStateDescriptor.cVertexBuffers[0].arrayStride = this.positionBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[0].format         = "float3";
        this._vertexStateDescriptor.cAttributes[0].shaderLocation = 0;
        this._vertexStateDescriptor.cAttributes[0].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[0].attributes  = [this._vertexStateDescriptor.cAttributes[0]];
        
        this._vertexStateDescriptor.cVertexBuffers[1].arrayStride = this.normalBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[1].format         = "float3";
        this._vertexStateDescriptor.cAttributes[1].shaderLocation = 1;
        this._vertexStateDescriptor.cAttributes[1].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[1].attributes  = [this._vertexStateDescriptor.cAttributes[1]];
        
        this._vertexStateDescriptor.cVertexBuffers[2].arrayStride = this.texCoordBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[2].format         = "float2";
        this._vertexStateDescriptor.cAttributes[2].shaderLocation = 2;
        this._vertexStateDescriptor.cAttributes[2].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[2].attributes  = [this._vertexStateDescriptor.cAttributes[2]];
        
        this._vertexStateDescriptor.cVertexBuffers[3].arrayStride = this.tangentBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[3].format         = "float3";
        this._vertexStateDescriptor.cAttributes[3].shaderLocation = 3;
        this._vertexStateDescriptor.cAttributes[3].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[3].attributes  = [this._vertexStateDescriptor.cAttributes[3]];
        
        this._vertexStateDescriptor.cVertexBuffers[4].arrayStride = this.biNormalBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[4].format         = "float3";
        this._vertexStateDescriptor.cAttributes[4].shaderLocation = 4;
        this._vertexStateDescriptor.cAttributes[4].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[4].attributes  = [this._vertexStateDescriptor.cAttributes[4]];
        
        this._vertexStateDescriptor.vertexBufferCount             = 5;
        this._vertexStateDescriptor.indexFormat                   = "uint16";

        this._groupLayoutModel = this._contextWebGPU.makeBindGroupLayout(
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
                        type: "sampler"
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "sampler"
                    },
                    {
                        binding: 3,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "sampled-texture",
                        hasDynamicOffset: false,
                        multisampled: false,
                        viewDimension: "2d",
                        textureComponentType: "float"
                    },
                    {
                        binding: 4,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "sampled-texture",
                        hasDynamicOffset: false,
                        multisampled: false,
                        viewDimension:"2d",
                        textureComponentType: "float"
                    },
                    {
                        binding: 5,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "sampled-texture",
                        hasDynamicOffset: false,
                        multisampled: false,
                        viewDimension:"2d",
                        textureComponentType: "float"
                    },
                    {
                        binding: 6,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "sampled-texture",
                        hasDynamicOffset: false,
                        multisampled: false,
                        viewDimension: "cube",
                        textureComponentType: "float"
                    }
                ]
            }
        );

        this._groupLayoutPer = this._contextWebGPU.makeBindGroupLayout(
            <GPUBindGroupLayoutDescriptor> {
                entries: <GPUBindGroupLayoutEntry[]> [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        type: "uniform-buffer"
                    }
                ]
            }
        )

        this._pipelineLayout = this._contextWebGPU.makeBasicPipelineLayout(
            <GPUPipelineLayoutDescriptor> {
                bindGroupLayouts: <GPUBindGroupLayout[]> [
                    this._contextWebGPU.groupLayoutGeneral,
                    this._contextWebGPU.groupLayoutWorld,
                    this._groupLayoutModel,
                    this._groupLayoutPer,
                ]
            }
        );

        this._pipeline = this._contextWebGPU.createRenderPipeline(
            this._pipelineLayout,
            this._programWebGPU,
            this._vertexStateDescriptor,
            this._blend
        );

        this._innerBuffer =
            this._contextWebGPU.createBufferFromData(this.innerUniforms.data,
                                                     InnerUniforms.byteSize,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        this._viewBuffer =
            this._contextWebGPU.createBufferFromData(this.worldUniformPer.data,
                                                     this._contextWebGPU.calcConstantBufferByteSize(this.worldUniformPer.byteSize),
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        this._bindGroupModel = this._contextWebGPU.makeBindGroup(
            <GPUBindGroupDescriptor> {
                layout: this._groupLayoutModel,
                entries: <GPUBindGroupEntry[]> [
                    {
                        binding: 0,
                        resource: <GPUBufferBinding> {
                            buffer: this._innerBuffer,
                            offset: 0,
                        }
                    },
                    {
                        binding: 1,
                        resource: this.reflectionTexture.sampler
                    },
                    {
                        binding: 2,
                        resource: this.skyboxTexture.sampler
                    },
                    {
                        binding: 3,
                        resource: this.diffuseTexture.textureView
                    },
                    {
                        binding: 4,
                        resource: this.normalTexture.textureView
                    },
                    {
                        binding: 5,
                        resource: this.reflectionTexture.textureView
                    },
                    {
                        binding: 6,
                        resource: this.skyboxTexture.textureView
                    }
                ]
            }
        );

        this._bindGroupPer = this._contextWebGPU.makeBindGroup(
            <GPUBindGroupDescriptor> {
                layout: this._groupLayoutPer,
                entries: <GPUBindGroupEntry[]> [
                    {
                        binding: 0,
                        resource: <GPUBufferBinding> {
                            buffer: this._viewBuffer,
                            offset: 0,
                        }
                    }
                ]
            }
        );

        this._contextWebGPU.setBufferData(this._innerBuffer, 0, InnerUniforms.byteSize,
                                          this.innerUniforms.data);
    }

    public prepareForDraw(): void {}

    public draw(): void {
        const pass: GPURenderPassEncoder = this._contextWebGPU.renderPass;
        pass.setPipeline(this._pipeline);
        pass.setBindGroup(0, this._contextWebGPU.bindGroupGeneral);
        pass.setBindGroup(1, this._contextWebGPU.bindGroupWorld);
        pass.setBindGroup(2, this._bindGroupModel);
        pass.setBindGroup(3, this._bindGroupPer);
        pass.setVertexBuffer(0, this.positionBuffer.buffer);
        pass.setVertexBuffer(1, this.normalBuffer.buffer);
        pass.setVertexBuffer(2, this.texCoordBuffer.buffer);
        pass.setVertexBuffer(3, this.tangentBuffer.buffer);
        pass.setVertexBuffer(4, this.biNormalBuffer.buffer);
        pass.setIndexBuffer(this.indicesBuffer.buffer, 0);
        pass.drawIndexed(this.indicesBuffer.totalComponents, 1, 0, 0, 0);
    }

    public updatePerInstanceUniforms(worldUniforms: WorldUniforms): void {
        this.worldUniformPer.worldUniforms[0] = worldUniforms;

        this._contextWebGPU.updateBufferData(this._viewBuffer, worldUniforms.data,
                                             this._contextWebGPU.calcConstantBufferByteSize(WorldUniforms.byteSize));
    }

}

/**
 * Defines the fish model of WebGPU.
 */
export class FishModelWebGPU extends FishModel {

    public fishVertexUniforms: Nullable<FishVertexUniforms> = new FishVertexUniforms();
    public lightFactorUniforms: Nullable<LightFactorUniforms> = new LightFactorUniforms();

    public diffuseTexture: Nullable<TextureWebGPU> = null;
    public normalTexture: Nullable<TextureWebGPU> = null;
    public reflectionTexture: Nullable<TextureWebGPU> = null;
    public skyboxTexture: Nullable<TextureWebGPU> = null;

    public positionBuffer: Nullable<BufferWebGPU> = null;
    public normalBuffer: Nullable<BufferWebGPU> = null;
    public texCoordBuffer: Nullable<BufferWebGPU> = null;
    public tangentBuffer: Nullable<BufferWebGPU> = null;
    public biNormalBuffer: Nullable<BufferWebGPU> = null;

    public indicesBuffer: Nullable<BufferWebGPU> = null;

    private _vertexStateDescriptor: Nullable<ComboVertexStateDescriptor> = null;
    private _pipeline: GPURenderPipeline;

    private _groupLayoutModel: GPUBindGroupLayout;
    private _pipelineLayout: GPUPipelineLayout;

    private _bindGroupModel: GPUBindGroup;

    private _fishVertexBuffer: GPUBuffer;
    private _lightFactorBuffer: GPUBuffer;

    private _programWebGPU: ProgramWebGPU;
    private _contextWebGPU: ContextWebGPU;

    private _enableDynamicBufferOffset: boolean;

    constructor(context: Nullable<Context>, aquarium: Nullable<Aquarium>, type: MODELGROUP, name: MODELNAME, blend: boolean) {
        super(type, name, blend, aquarium);

        this._contextWebGPU = context as Nullable<ContextWebGPU>;
        this._vertexStateDescriptor = new ComboVertexStateDescriptor();

        this._enableDynamicBufferOffset = aquarium.toggleBitset[TOGGLE.ENABLEDYNAMICBUFFEROFFSET];

        this.lightFactorUniforms.shininess      = 5.0;
        this.lightFactorUniforms.specularFactor = 0.3;

        const fishInfo: Fish                   = fishTable[name - MODELNAME.MODELSMALLFISHA];
        this.fishVertexUniforms.fishLength     = fishInfo.fishLength;
        this.fishVertexUniforms.fishBendAmount = fishInfo.fishBendAmount;
        this.fishVertexUniforms.fishWaveLength = fishInfo.fishWaveLength;

        this._curInstance = this._aquarium.fishCount[fishInfo.modelName - MODELNAME.MODELSMALLFISHA];
        this._preInstance = this._curInstance;
    }

    public dispose(): void {
        this._pipeline          = null;
        this._groupLayoutModel  = null;
        this._pipelineLayout    = null;
        this._bindGroupModel    = null;
        this._fishVertexBuffer  = null;
        this._lightFactorBuffer = null;
    }

    public init(): void {
        this._programWebGPU = this._program as Nullable<ProgramWebGPU>;
        
        this.diffuseTexture    = this.textureMap["diffuse"] as TextureWebGPU;
        this.normalTexture     = this.textureMap["normalMap"] as TextureWebGPU;
        this.reflectionTexture = this.textureMap["reflectionMap"] as TextureWebGPU;
        this.skyboxTexture     = this.textureMap["skybox"] as TextureWebGPU;

        this.positionBuffer = this.bufferMap["position"] as BufferWebGPU;
        this.normalBuffer   = this.bufferMap["normal"] as BufferWebGPU;
        this.texCoordBuffer = this.bufferMap["texCoord"] as BufferWebGPU;
        this.tangentBuffer  = this.bufferMap["tangent"] as BufferWebGPU;
        this.biNormalBuffer = this.bufferMap["binormal"] as BufferWebGPU;
        this.indicesBuffer  = this.bufferMap["indices"] as BufferWebGPU;

        this._vertexStateDescriptor.cVertexBuffers[0].arrayStride = this.positionBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[0].format         = "float3";
        this._vertexStateDescriptor.cAttributes[0].shaderLocation = 0;
        this._vertexStateDescriptor.cAttributes[0].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[0].attributes  = [this._vertexStateDescriptor.cAttributes[0]];
        
        this._vertexStateDescriptor.cVertexBuffers[1].arrayStride = this.normalBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[1].format         = "float3";
        this._vertexStateDescriptor.cAttributes[1].shaderLocation = 1;
        this._vertexStateDescriptor.cAttributes[1].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[1].attributes  = [this._vertexStateDescriptor.cAttributes[1]];
        
        this._vertexStateDescriptor.cVertexBuffers[2].arrayStride = this.texCoordBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[2].format         = "float2";
        this._vertexStateDescriptor.cAttributes[2].shaderLocation = 2;
        this._vertexStateDescriptor.cAttributes[2].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[2].attributes  = [this._vertexStateDescriptor.cAttributes[2]];
        
        this._vertexStateDescriptor.cVertexBuffers[3].arrayStride = this.tangentBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[3].format         = "float3";
        this._vertexStateDescriptor.cAttributes[3].shaderLocation = 3;
        this._vertexStateDescriptor.cAttributes[3].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[3].attributes  = [this._vertexStateDescriptor.cAttributes[3]];
        
        this._vertexStateDescriptor.cVertexBuffers[4].arrayStride = this.biNormalBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[4].format         = "float3";
        this._vertexStateDescriptor.cAttributes[4].shaderLocation = 4;
        this._vertexStateDescriptor.cAttributes[4].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[4].attributes  = [this._vertexStateDescriptor.cAttributes[4]];
        
        this._vertexStateDescriptor.vertexBufferCount             = 5;
        this._vertexStateDescriptor.indexFormat                   = "uint16";

        if (this.skyboxTexture && this.reflectionTexture) {
            this._groupLayoutModel = this._contextWebGPU.makeBindGroupLayout(
                <GPUBindGroupLayoutDescriptor> {
                    entries: <GPUBindGroupLayoutEntry[]> [
                        {
                            binding: 0,
                            visibility: GPUShaderStage.VERTEX,
                            type: "uniform-buffer"
                        },
                        {
                            binding: 1,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "uniform-buffer"
                        },
                        {
                            binding: 2,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampler"
                        },
                        {
                            binding: 3,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampler"
                        },
                        {
                            binding: 4,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension: "2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 5,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 6,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 7,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension: "cube",
                            textureComponentType: "float"
                        }
                    ]
                }
            );
        }
        else {
            this._groupLayoutModel = this._contextWebGPU.makeBindGroupLayout(
                <GPUBindGroupLayoutDescriptor> {
                    entries: <GPUBindGroupLayoutEntry[]> [
                        {
                            binding: 0,
                            visibility: GPUShaderStage.VERTEX,
                            type: "uniform-buffer"
                        },
                        {
                            binding: 1,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "uniform-buffer"
                        },
                        {
                            binding: 2,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampler"
                        },
                        {
                            binding: 3,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension: "2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 4,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension: "2d",
                            textureComponentType: "float"
                        }
                    ]
                }
            );
        }

        this._pipelineLayout = this._contextWebGPU.makeBasicPipelineLayout(
            <GPUPipelineLayoutDescriptor> {
                bindGroupLayouts: <GPUBindGroupLayout[]> [
                    this._contextWebGPU.groupLayoutGeneral,
                    this._contextWebGPU.groupLayoutWorld,
                    this._groupLayoutModel,
                    this._contextWebGPU.groupLayoutFishPer,
                ]
            }
        );

        this._pipeline = this._contextWebGPU.createRenderPipeline(this._pipelineLayout, this._programWebGPU,
                                                                  this._vertexStateDescriptor, this._blend);

        this._fishVertexBuffer =
            this._contextWebGPU.createBufferFromData(this.fishVertexUniforms.data, FishVertexUniforms.byteSize,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);
        this._lightFactorBuffer =
            this._contextWebGPU.createBufferFromData(this.lightFactorUniforms.data, LightFactorUniforms.byteSize,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        // Fish models includes small, medium and big. Some of them contains reflection and skybox
        // texture, but some doesn't.
        if (this.skyboxTexture && this.reflectionTexture) {
            this._bindGroupModel = this._contextWebGPU.makeBindGroup(
                <GPUBindGroupDescriptor> {
                    layout: this._groupLayoutModel,
                    entries: <GPUBindGroupEntry[]> [
                        {
                            binding: 0,
                            resource: <GPUBufferBinding> {
                                buffer: this._fishVertexBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 1,
                            resource: <GPUBufferBinding> {
                                buffer: this._lightFactorBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 2,
                            resource: this.reflectionTexture.sampler
                        },
                        {
                            binding: 3,
                            resource: this.skyboxTexture.sampler
                        },
                        {
                            binding: 4,
                            resource: this.diffuseTexture.textureView
                        },
                        {
                            binding: 5,
                            resource: this.normalTexture.textureView
                        },
                        {
                            binding: 6,
                            resource: this.reflectionTexture.textureView
                        },
                        {
                            binding: 7,
                            resource: this.skyboxTexture.textureView
                        }
                    ]
                }
            );
        } else {
            this._bindGroupModel = this._contextWebGPU.makeBindGroup(
                <GPUBindGroupDescriptor> {
                    layout: this._groupLayoutModel,
                    entries: <GPUBindGroupEntry[]> [
                        {
                            binding: 0,
                            resource: <GPUBufferBinding> {
                                buffer: this._fishVertexBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 1,
                            resource: <GPUBufferBinding> {
                                buffer: this._lightFactorBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 2,
                            resource: this.diffuseTexture.sampler
                        },
                        {
                            binding: 3,
                            resource: this.diffuseTexture.textureView
                        },
                        {
                            binding: 4,
                            resource: this.normalTexture.textureView
                        }
                    ]
                }
            );
        }

        this._contextWebGPU.setBufferData(this._lightFactorBuffer, 0, LightFactorUniforms.byteSize,
                                          this.lightFactorUniforms.data);
        this._contextWebGPU.setBufferData(this._fishVertexBuffer, 0, FishVertexUniforms.byteSize,
                                          this.fishVertexUniforms.data);
    }

    public draw(): void {
        if (this._curInstance == 0) {
            return;
        }

        const pass = this._contextWebGPU.renderPass;
        pass.setPipeline(this._pipeline);
        pass.setBindGroup(0, this._contextWebGPU.bindGroupGeneral);
        pass.setBindGroup(1, this._contextWebGPU.bindGroupWorld);
        pass.setBindGroup(2, this._bindGroupModel);
        pass.setVertexBuffer(0, this.positionBuffer.buffer);
        pass.setVertexBuffer(1, this.normalBuffer.buffer);
        pass.setVertexBuffer(2, this.texCoordBuffer.buffer);
        pass.setVertexBuffer(3, this.tangentBuffer.buffer);
        pass.setVertexBuffer(4, this.biNormalBuffer.buffer);
        pass.setIndexBuffer(this.indicesBuffer.buffer, 0);
        
        if (this._enableDynamicBufferOffset) {
            for (let i: uint32_t = 0; i < this._curInstance; ++i) {
                const offset: uint32_t = 256 * (i + this._fishPerOffset);
                pass.setBindGroup(3, this._contextWebGPU.bindGroupFishPers[0], [offset]);
                pass.drawIndexed(this.indicesBuffer.totalComponents, 1, 0, 0, 0);
            }
        }
        else {
            for (let i: uint32_t = 0; i < this._curInstance; ++i) {
                pass.setBindGroup(3, this._contextWebGPU.bindGroupFishPers[i + this._fishPerOffset]);
                pass.drawIndexed(this.indicesBuffer.totalComponents, 1, 0, 0, 0);
            }
        }
    }

    public updatePerInstanceUniforms(worldUniforms: WorldUniforms): void { }

    public updateFishPerUniforms(x: float, y: float, z: float,
                                 nextX: float, nextY: float, nextZ: float,
                                 scale: float, time: float, index: int): void {
        index += this._fishPerOffset;
        this._contextWebGPU.fishPers[index].worldPosition[0] = x;
        this._contextWebGPU.fishPers[index].worldPosition[1] = y;
        this._contextWebGPU.fishPers[index].worldPosition[2] = z;
        this._contextWebGPU.fishPers[index].nextPosition[0]  = nextX;
        this._contextWebGPU.fishPers[index].nextPosition[1]  = nextY;
        this._contextWebGPU.fishPers[index].nextPosition[2]  = nextZ;
        this._contextWebGPU.fishPers[index].scale            = scale;
        this._contextWebGPU.fishPers[index].time             = time;
    }

}

/**
 * Defines the fish instanced draw model of WebGPU.
 */
export class FishModelInstancedDrawWebGPU extends FishModel {

    public fishVertexUniforms: Nullable<FishVertexUniforms> = new FishVertexUniforms();
    public lightFactorUniforms: Nullable<LightFactorUniforms> = new LightFactorUniforms();
    public fishPers: Array<FishPer> = new Array<FishPer>();

    public diffuseTexture: Nullable<TextureWebGPU> = null;
    public normalTexture: Nullable<TextureWebGPU> = null;
    public reflectionTexture: Nullable<TextureWebGPU> = null;
    public skyboxTexture: Nullable<TextureWebGPU> = null;

    public positionBuffer: Nullable<BufferWebGPU> = null;
    public normalBuffer: Nullable<BufferWebGPU> = null;
    public texCoordBuffer: Nullable<BufferWebGPU> = null;
    public tangentBuffer: Nullable<BufferWebGPU> = null;
    public biNormalBuffer: Nullable<BufferWebGPU> = null;

    public indicesBuffer: Nullable<BufferWebGPU> = null;

    private _vertexStateDescriptor: Nullable<ComboVertexStateDescriptor> = null;
    private _pipeline: GPURenderPipeline;

    private _groupLayoutModel: GPUBindGroupLayout;
    private _groupLayoutPer: GPUBindGroupLayout;
    private _pipelineLayout: GPUPipelineLayout;

    private _bindGroupModel: GPUBindGroup;
    private _bindGroupPer: GPUBindGroup;

    private _fishVertexBuffer: GPUBuffer;
    private _lightFactorBuffer: GPUBuffer;

    private _fishPersBuffer: GPUBuffer;

    private _instance: int;

    private _programWebGPU: Nullable<ProgramWebGPU> = null;
    private _contextWebGPU: Nullable<ContextWebGPU> = null;

    constructor(context: Nullable<Context>, aquarium: Nullable<Aquarium>, type: MODELGROUP, name: MODELNAME, blend: boolean) {
        super(type, name, blend, aquarium);
        this._instance = 0;

        this._contextWebGPU = context as Nullable<ContextWebGPU>;
        this._vertexStateDescriptor = new ComboVertexStateDescriptor();

        this.lightFactorUniforms.shininess      = 5.0;
        this.lightFactorUniforms.specularFactor = 0.3;

        const fishInfo: Fish                   = fishTable[name - MODELNAME.MODELSMALLFISHAINSTANCEDDRAWS];
        this.fishVertexUniforms.fishLength     = fishInfo.fishLength;
        this.fishVertexUniforms.fishBendAmount = fishInfo.fishBendAmount;
        this.fishVertexUniforms.fishWaveLength = fishInfo.fishWaveLength;

        this._instance = aquarium.fishCount[fishInfo.modelName - MODELNAME.MODELSMALLFISHA];
        this.fishPers = BuildArray(this._instance, () => new FishPer());
    }

    public init(): void {
        if (this._instance == 0) {
            return;
        }

        this._programWebGPU = this._program as Nullable<ProgramWebGPU>;

        this.diffuseTexture    = this.textureMap["diffuse"] as TextureWebGPU;
        this.normalTexture     = this.textureMap["normalMap"] as TextureWebGPU;
        this.reflectionTexture = this.textureMap["reflectionMap"] as TextureWebGPU;
        this.skyboxTexture     = this.textureMap["skybox"] as TextureWebGPU;

        this.positionBuffer = this.bufferMap["position"] as BufferWebGPU;
        this.normalBuffer   = this.bufferMap["normal"] as BufferWebGPU;
        this.texCoordBuffer = this.bufferMap["texCoord"] as BufferWebGPU;
        this.tangentBuffer  = this.bufferMap["tangent"] as BufferWebGPU;
        this.biNormalBuffer = this.bufferMap["binormal"] as BufferWebGPU;
        this.indicesBuffer  = this.bufferMap["indices"] as BufferWebGPU;

        this._fishPersBuffer =
            this._contextWebGPU.createBuffer(FishPer.byteSize * this._instance,
                                             GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);

        this._vertexStateDescriptor.cVertexBuffers[0].arrayStride = this.positionBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[0].format         = "float3";
        this._vertexStateDescriptor.cAttributes[0].shaderLocation = 0;
        this._vertexStateDescriptor.cAttributes[0].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[0].attributes  = [this._vertexStateDescriptor.cAttributes[0]];
        
        this._vertexStateDescriptor.cVertexBuffers[1].arrayStride = this.normalBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[1].format         = "float3";
        this._vertexStateDescriptor.cAttributes[1].shaderLocation = 1;
        this._vertexStateDescriptor.cAttributes[1].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[1].attributes  = [this._vertexStateDescriptor.cAttributes[1]];
        
        this._vertexStateDescriptor.cVertexBuffers[2].arrayStride = this.texCoordBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[2].format         = "float2";
        this._vertexStateDescriptor.cAttributes[2].shaderLocation = 2;
        this._vertexStateDescriptor.cAttributes[2].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[2].attributes  = [this._vertexStateDescriptor.cAttributes[2]];
        
        this._vertexStateDescriptor.cVertexBuffers[3].arrayStride = this.tangentBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[3].format         = "float3";
        this._vertexStateDescriptor.cAttributes[3].shaderLocation = 3;
        this._vertexStateDescriptor.cAttributes[3].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[3].attributes  = [this._vertexStateDescriptor.cAttributes[3]];
        
        this._vertexStateDescriptor.cVertexBuffers[4].arrayStride = this.biNormalBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[4].format         = "float3";
        this._vertexStateDescriptor.cAttributes[4].shaderLocation = 4;
        this._vertexStateDescriptor.cAttributes[4].offset         = FishPer.offsetof("worldPosition");
        this._vertexStateDescriptor.cVertexBuffers[4].attributes  = [this._vertexStateDescriptor.cAttributes[4]];

        this._vertexStateDescriptor.cVertexBuffers[5].arrayStride = FishPer.byteSize;
        this._vertexStateDescriptor.cAttributes[5].format         = "float3";
        this._vertexStateDescriptor.cAttributes[5].shaderLocation = 5;
        this._vertexStateDescriptor.cAttributes[5].offset         = 0; // FishPer.offsetof("worldPosition");
    
        this._vertexStateDescriptor.cAttributes[6].format         = "float";
        this._vertexStateDescriptor.cAttributes[6].shaderLocation = 6;
        this._vertexStateDescriptor.cAttributes[6].offset         = FishPer.offsetof("scale");
    
        this._vertexStateDescriptor.cAttributes[7].format         = "float3";
        this._vertexStateDescriptor.cAttributes[7].shaderLocation = 7;
        this._vertexStateDescriptor.cAttributes[7].offset         = FishPer.offsetof("nextPosition");
    
        this._vertexStateDescriptor.cAttributes[8].format         = "float";
        this._vertexStateDescriptor.cAttributes[8].shaderLocation = 8;
        this._vertexStateDescriptor.cAttributes[8].offset         = FishPer.offsetof("time");
    
        this._vertexStateDescriptor.cVertexBuffers[5].attributes  = this._vertexStateDescriptor.cAttributes.slice(5, 9);
        this._vertexStateDescriptor.cVertexBuffers[5].stepMode    = "instance";

        this._vertexStateDescriptor.vertexBufferCount             = 6;
        this._vertexStateDescriptor.indexFormat                   = "uint16";

        if (this.skyboxTexture && this.reflectionTexture) {
            this._groupLayoutModel = this._contextWebGPU.makeBindGroupLayout(
                <GPUBindGroupLayoutDescriptor> {
                    entries: <GPUBindGroupLayoutEntry[]> [
                        {
                            binding: 0,
                            visibility: GPUShaderStage.VERTEX,
                            type: "uniform-buffer"
                        },
                        {
                            binding: 1,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "uniform-buffer"
                        },
                        {
                            binding: 2,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampler"
                        },
                        {
                            binding: 3,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampler"
                        },
                        {
                            binding: 4,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension: "2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 5,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 6,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 7,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension: "cube",
                            textureComponentType: "float"
                        }
                    ]
                }
            );
        }
        else {
            this._groupLayoutModel = this._contextWebGPU.makeBindGroupLayout(
                <GPUBindGroupLayoutDescriptor> {
                    entries: <GPUBindGroupLayoutEntry[]> [
                        {
                            binding: 0,
                            visibility: GPUShaderStage.VERTEX,
                            type: "uniform-buffer"
                        },
                        {
                            binding: 1,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "uniform-buffer"
                        },
                        {
                            binding: 2,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampler"
                        },
                        {
                            binding: 3,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        },
                        {
                            binding: 4,
                            visibility: GPUShaderStage.FRAGMENT,
                            type: "sampled-texture",
                            hasDynamicOffset: false,
                            multisampled: false,
                            viewDimension:"2d",
                            textureComponentType: "float"
                        }
                    ]
                }
            );
        }

        this._groupLayoutPer = this._contextWebGPU.makeBindGroupLayout(
            <GPUBindGroupLayoutDescriptor> {
                entries: <GPUBindGroupLayoutEntry[]> [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        type: "uniform-buffer"
                    }
                ]
            }
        )

        this._pipelineLayout = this._contextWebGPU.makeBasicPipelineLayout(
            <GPUPipelineLayoutDescriptor> {
                bindGroupLayouts: <GPUBindGroupLayout[]> [
                    this._contextWebGPU.groupLayoutGeneral,
                    this._contextWebGPU.groupLayoutWorld,
                    this._groupLayoutModel,
                    this._groupLayoutPer,
                ]
            }
        );

        this._pipeline = this._contextWebGPU.createRenderPipeline(
            this._pipelineLayout,
            this._programWebGPU,
            this._vertexStateDescriptor,
            this._blend
        );

        this._fishVertexBuffer =
            this._contextWebGPU.createBufferFromData(this.fishVertexUniforms.data, FishVertexUniforms.byteSize,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);
        this._lightFactorBuffer =
            this._contextWebGPU.createBufferFromData(this.lightFactorUniforms.data, LightFactorUniforms.byteSize,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        // Fish models includes small, medium and big. Some of them contains reflection and skybox
        // texture, but some doesn't.
        if (this.skyboxTexture && this.reflectionTexture) {
            this._bindGroupModel = this._contextWebGPU.makeBindGroup(
                <GPUBindGroupDescriptor> {
                    layout: this._groupLayoutModel,
                    entries: <GPUBindGroupEntry[]> [
                        {
                            binding: 0,
                            resource: <GPUBufferBinding> {
                                buffer: this._fishVertexBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 1,
                            resource: <GPUBufferBinding> {
                                buffer: this._lightFactorBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 2,
                            resource: this.reflectionTexture.sampler
                        },
                        {
                            binding: 3,
                            resource: this.skyboxTexture.sampler
                        },
                        {
                            binding: 4,
                            resource: this.diffuseTexture.textureView
                        },
                        {
                            binding: 5,
                            resource: this.normalTexture.textureView
                        },
                        {
                            binding: 6,
                            resource: this.reflectionTexture.textureView
                        },
                        {
                            binding: 7,
                            resource: this.skyboxTexture.textureView
                        }
                    ]
                }
            );
        } else {
            this._bindGroupModel = this._contextWebGPU.makeBindGroup(
                <GPUBindGroupDescriptor> {
                    layout: this._groupLayoutModel,
                    entries: <GPUBindGroupEntry[]> [
                        {
                            binding: 0,
                            resource: <GPUBufferBinding> {
                                buffer: this._fishVertexBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 1,
                            resource: <GPUBufferBinding> {
                                buffer: this._lightFactorBuffer,
                                offset: 0,
                            }
                        },
                        {
                            binding: 2,
                            resource: this.diffuseTexture.sampler
                        },
                        {
                            binding: 3,
                            resource: this.diffuseTexture.textureView
                        },
                        {
                            binding: 4,
                            resource: this.normalTexture.textureView
                        }
                    ]
                }
            );
        }

        this._contextWebGPU.setBufferData(this._lightFactorBuffer, 0, LightFactorUniforms.byteSize,
                                          this.lightFactorUniforms.data);
        this._contextWebGPU.setBufferData(this._fishVertexBuffer, 0, FishVertexUniforms.byteSize,
                                          this.fishVertexUniforms.data);
    }

    public prepareForDraw(): void { }

    public draw(): void {
        if (this._instance == 0) {
            return;
        }

        this._contextWebGPU.setBufferData(this._fishPersBuffer, 0, FishPer.byteSize * this._instance,
                                          new Float32Array(FishPer.toArray(this.fishPers)));

        const pass = this._contextWebGPU.renderPass;
        pass.setPipeline(this._pipeline);
        pass.setBindGroup(0, this._contextWebGPU.bindGroupGeneral);
        pass.setBindGroup(1, this._contextWebGPU.bindGroupWorld);
        pass.setBindGroup(2, this._bindGroupModel);
        pass.setVertexBuffer(0, this.positionBuffer.buffer);
        pass.setVertexBuffer(1, this.normalBuffer.buffer);
        pass.setVertexBuffer(2, this.texCoordBuffer.buffer);
        pass.setVertexBuffer(3, this.tangentBuffer.buffer);
        pass.setVertexBuffer(4, this.biNormalBuffer.buffer);
        pass.setVertexBuffer(5, this._fishPersBuffer);
        pass.setIndexBuffer(this.indicesBuffer.buffer, 0);
        pass.drawIndexed(this.indicesBuffer.totalComponents, this._instance, 0, 0, 0);
    }

    public updatePerInstanceUniforms(worldUniforms: WorldUniforms): void { }

    public updateFishPerUniforms(x: float, y: float, z: float,
                                 nextX: float, nextY: float, nextZ: float,
                                 scale: float, time: float, index: int): void {
        this.fishPers[index].worldPosition[0] = x;
        this.fishPers[index].worldPosition[1] = y;
        this.fishPers[index].worldPosition[2] = z;
        this.fishPers[index].nextPosition[0]  = nextX;
        this.fishPers[index].nextPosition[1]  = nextY;
        this.fishPers[index].nextPosition[2]  = nextZ;
        this.fishPers[index].scale            = scale;
        this.fishPers[index].time             = time;
    }

    public dispose(): void {
        this._pipeline          = null;
        this._groupLayoutModel  = null;
        this._groupLayoutPer    = null;
        this._pipelineLayout    = null;
        this._bindGroupModel    = null;
        this._bindGroupPer      = null;
        this._fishVertexBuffer  = null;
        this._lightFactorBuffer = null;
        this._fishPersBuffer    = null;
        this.fishPers.length    = 0;
    }
}

/**
 * Defines the seaweed model of WebGPU.
 */
export class SeaweedModelWebGPU extends SeaweedModel {

    public diffuseTexture: Nullable<TextureWebGPU> = null;
    public normalTexture: Nullable<TextureWebGPU> = null;
    public reflectionTexture: Nullable<TextureWebGPU> = null;
    public skyboxTexture: Nullable<TextureWebGPU> = null;

    public positionBuffer: Nullable<BufferWebGPU> = null;
    public normalBuffer: Nullable<BufferWebGPU> = null;
    public texCoordBuffer: Nullable<BufferWebGPU> = null;

    public indicesBuffer: Nullable<BufferWebGPU> = null;

    public lightFactorUniforms: Nullable<LightFactorUniforms> = new LightFactorUniforms();
    public seaweedPer: Nullable<SeaweedPer> = new SeaweedPer();
    public worldUniformPer: Nullable<WorldUniformPer> = new WorldUniformPer();

    private _vertexStateDescriptor: Nullable<ComboVertexStateDescriptor> = null;
    private _pipeline: GPURenderPipeline;

    private _groupLayoutModel: GPUBindGroupLayout;
    private _groupLayoutPer: GPUBindGroupLayout;
    private _pipelineLayout: GPUPipelineLayout;

    private _bindGroupModel: GPUBindGroup;
    private _bindGroupPer: GPUBindGroup;

    private _lightFactorBuffer: GPUBuffer;
    private _timeBuffer: GPUBuffer;
    private _viewBuffer: GPUBuffer;

    private _contextWebGPU: Nullable<ContextWebGPU> = null;
    private _programWebGPU: Nullable<ProgramWebGPU> = null;
    private _aquarium: Nullable<Aquarium> = null;

    private _instance: int;

    constructor(context: Nullable<Context>, aquarium: Nullable<Aquarium>, type: MODELGROUP, name: MODELNAME, blend: boolean) {
        super(type, name, blend);
        this._instance = 0;

        this._contextWebGPU = context as Nullable<ContextWebGPU>;
        this._aquarium      = aquarium;

        this._vertexStateDescriptor = new ComboVertexStateDescriptor();

        this.lightFactorUniforms.shininess      = 50.0;
        this.lightFactorUniforms.specularFactor = 1.0;
    }

    public dispose(): void {
        this._pipeline          = null;
        this._groupLayoutModel  = null;
        this._groupLayoutPer    = null;
        this._pipelineLayout    = null;
        this._bindGroupModel    = null;
        this._bindGroupPer      = null;
        this._lightFactorBuffer = null;
        this._viewBuffer        = null;
        this._timeBuffer        = null;
    }

    public init(): void {
        this._programWebGPU = this._program as Nullable<ProgramWebGPU>;

        this.diffuseTexture    = this.textureMap["diffuse"] as TextureWebGPU;
        this.normalTexture     = this.textureMap["normalMap"] as TextureWebGPU;
        this.reflectionTexture = this.textureMap["reflectionMap"] as TextureWebGPU;
        this.skyboxTexture     = this.textureMap["skybox"] as TextureWebGPU;

        this.positionBuffer = this.bufferMap["position"] as BufferWebGPU;
        this.normalBuffer   = this.bufferMap["normal"] as BufferWebGPU;
        this.texCoordBuffer = this.bufferMap["texCoord"] as BufferWebGPU;
        this.indicesBuffer  = this.bufferMap["indices"] as BufferWebGPU;

        this._vertexStateDescriptor.cVertexBuffers[0].arrayStride = this.positionBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[0].format         = "float3";
        this._vertexStateDescriptor.cAttributes[0].shaderLocation = 0;
        this._vertexStateDescriptor.cAttributes[0].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[0].attributes  = [this._vertexStateDescriptor.cAttributes[0]];
        
        this._vertexStateDescriptor.cVertexBuffers[1].arrayStride = this.normalBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[1].format         = "float3";
        this._vertexStateDescriptor.cAttributes[1].shaderLocation = 1;
        this._vertexStateDescriptor.cAttributes[1].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[1].attributes  = [this._vertexStateDescriptor.cAttributes[1]];
        
        this._vertexStateDescriptor.cVertexBuffers[2].arrayStride = this.texCoordBuffer.dataSize;
        this._vertexStateDescriptor.cAttributes[2].format         = "float2";
        this._vertexStateDescriptor.cAttributes[2].shaderLocation = 2;
        this._vertexStateDescriptor.cAttributes[2].offset         = 0;
        this._vertexStateDescriptor.cVertexBuffers[2].attributes  = [this._vertexStateDescriptor.cAttributes[2]];
          
        this._vertexStateDescriptor.vertexBufferCount             = 3;
        this._vertexStateDescriptor.indexFormat                   = "uint16";

        this._groupLayoutModel = this._contextWebGPU.makeBindGroupLayout(
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
                        type: "sampler"
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT,
                        type: "sampled-texture",
                        hasDynamicOffset: false,
                        multisampled: false,
                        viewDimension:"2d",
                        textureComponentType: "float"
                    }
                ]
            }
        );

        this._groupLayoutPer = this._contextWebGPU.makeBindGroupLayout(
            <GPUBindGroupLayoutDescriptor> {
                entries: <GPUBindGroupLayoutEntry[]> [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        type: "uniform-buffer"
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.VERTEX,
                        type: "uniform-buffer"
                    }
                ]
            }
        )

        this._pipelineLayout = this._contextWebGPU.makeBasicPipelineLayout(
            <GPUPipelineLayoutDescriptor> {
                bindGroupLayouts: <GPUBindGroupLayout[]> [
                    this._contextWebGPU.groupLayoutGeneral,
                    this._contextWebGPU.groupLayoutWorld,
                    this._groupLayoutModel,
                    this._groupLayoutPer,
                ]
            }
        );

        this._pipeline = this._contextWebGPU.createRenderPipeline(
            this._pipelineLayout,
            this._programWebGPU,
            this._vertexStateDescriptor,
            this._blend
        );

        this._lightFactorBuffer =
            this._contextWebGPU.createBufferFromData(this.lightFactorUniforms.data,
                                                     LightFactorUniforms.byteSize,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        this._timeBuffer =
            this._contextWebGPU.createBufferFromData(this.seaweedPer.data,
                                                     this._contextWebGPU.calcConstantBufferByteSize(this.seaweedPer.byteSize) * 4,
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        this._viewBuffer =
            this._contextWebGPU.createBufferFromData(this.worldUniformPer.data,
                                                     this._contextWebGPU.calcConstantBufferByteSize(this.worldUniformPer.byteSize),
                                                     GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

        this._bindGroupModel = this._contextWebGPU.makeBindGroup(
            <GPUBindGroupDescriptor> {
                layout: this._groupLayoutModel,
                entries: <GPUBindGroupEntry[]> [
                    {
                        binding: 0,
                        resource: <GPUBufferBinding> {
                            buffer: this._lightFactorBuffer,
                            offset: 0,
                        }
                    },
                    {
                        binding: 1,
                        resource: this.diffuseTexture.sampler
                    },
                    {
                        binding: 2,
                        resource: this.diffuseTexture.textureView
                    }
                ]
            }
        );

        this._bindGroupPer = this._contextWebGPU.makeBindGroup(
            <GPUBindGroupDescriptor> {
                layout: this._groupLayoutPer,
                entries: <GPUBindGroupEntry[]> [
                    {
                        binding: 0,
                        resource: <GPUBufferBinding> {
                            buffer: this._viewBuffer,
                            offset: 0,
                        }
                    },
                    {
                        binding: 1,
                        resource: <GPUBufferBinding> {
                            buffer: this._timeBuffer,
                            offset: 0,
                        }
                    }
                ]
            }
        );

        this._contextWebGPU.setBufferData(this._lightFactorBuffer, 0, LightFactorUniforms.byteSize,
                                          this.lightFactorUniforms.data);
    }

    public prepareForDraw(): void {
        this._contextWebGPU.updateBufferData(this._viewBuffer, this.worldUniformPer.data,
            this._contextWebGPU.calcConstantBufferByteSize(this.worldUniformPer.byteSize));
        this._contextWebGPU.updateBufferData(this._timeBuffer, this.seaweedPer.data,
            this._contextWebGPU.calcConstantBufferByteSize(this.seaweedPer.byteSize));
    }

    public draw(): void {
        const pass = this._contextWebGPU.renderPass;
        pass.setPipeline(this._pipeline);
        pass.setBindGroup(0, this._contextWebGPU.bindGroupGeneral);
        pass.setBindGroup(1, this._contextWebGPU.bindGroupWorld);
        pass.setBindGroup(2, this._bindGroupModel);
        pass.setBindGroup(3, this._bindGroupPer);
        pass.setVertexBuffer(0, this.positionBuffer.buffer);
        pass.setVertexBuffer(1, this.normalBuffer.buffer);
        pass.setVertexBuffer(2, this.texCoordBuffer.buffer);
        pass.setIndexBuffer(this.indicesBuffer.buffer, 0);
        pass.drawIndexed(this.indicesBuffer.totalComponents, this._instance, 0, 0, 0);
        this._instance = 0;
    }

    public updatePerInstanceUniforms(worldUniforms: WorldUniforms): void {
        this.worldUniformPer.worldUniforms[this._instance] = worldUniforms;
        this.seaweedPer.time[this._instance]               = this._aquarium.g.mclock + this._instance;

        this._instance++;
    }

    public updateSeaweedModelTime(time: float): void { }

}