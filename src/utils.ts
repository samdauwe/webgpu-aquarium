/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

import { BuildArray, int, size_t, uint32_t } from "./types";

export class ComboRenderPassDescriptor implements GPURenderPassDescriptor {

    public static readonly kMaxColorAttachments: size_t = 4;

    public colorAttachments: Array<GPURenderPassColorAttachmentDescriptor>;
    public depthStencilAttachment?: GPURenderPassDepthStencilAttachmentDescriptor;

    public cColorAttachments: Array<GPURenderPassColorAttachmentDescriptor>;
    public cDepthStencilAttachmentInfo?: GPURenderPassDepthStencilAttachmentDescriptor;

    public _colorAttachmentCount: uint32_t = 0;

    constructor(colorAttachmentInfo: Array<GPUTextureView>, depthStencil?: GPUTextureView) {
        this.cColorAttachments = BuildArray(
            ComboRenderPassDescriptor.kMaxColorAttachments,
            () => <GPURenderPassColorAttachmentDescriptor>{}
        );

        for (let i: uint32_t = 0; i < ComboRenderPassDescriptor.kMaxColorAttachments; ++i) {
            this.cColorAttachments[i].attachment = undefined;
            this.cColorAttachments[i].storeOp = "store";
            this.cColorAttachments[i].loadValue = <GPUColorDict>{
                r: 0.0,
                g: 0.0,
                b: 0.0,
                a: 0.0
            };
        }

        this.cDepthStencilAttachmentInfo = <GPURenderPassDepthStencilAttachmentDescriptor> {
            depthLoadValue: 1.0,
            depthStoreOp: "store",
            stencilLoadValue: 0,
            stencilStoreOp: "store"
        }

        this._colorAttachmentCount = colorAttachmentInfo.length;
        let colorAttachmentIndex: uint32_t = 0;
        for (let colorAttachment of colorAttachmentInfo) {
            if (colorAttachment) {
                this.cColorAttachments[colorAttachmentIndex].attachment = colorAttachment;
            }
            ++colorAttachmentIndex;
        }
        this.colorAttachments = this.cColorAttachments

        if (depthStencil) {
            this.cDepthStencilAttachmentInfo.attachment = depthStencil;
            this.depthStencilAttachment = this.cDepthStencilAttachmentInfo;
        }
        else {
            this.depthStencilAttachment = undefined;
        }
    }

    public set colorAttachmentCount(value: uint32_t) {
        this._colorAttachmentCount = value;
        this.colorAttachments = this.cColorAttachments.slice(0, this._colorAttachmentCount);
    }

}

export class ComboRenderPipelineDescriptor implements GPUPipelineDescriptorBase, GPURenderPipelineDescriptor {

    public static readonly kMaxColorAttachments: size_t = 4;

    public label?: string;
    public layout?: GPUPipelineLayout;

    public vertexStage: GPUProgrammableStageDescriptor;
    public fragmentStage?: GPUProgrammableStageDescriptor;

    public primitiveTopology: GPUPrimitiveTopology;
    public rasterizationState?: GPURasterizationStateDescriptor;
    public colorStates: Iterable<GPUColorStateDescriptor>;
    public depthStencilState?: GPUDepthStencilStateDescriptor;
    public vertexState?: GPUVertexStateDescriptor;

    public sampleCount?: number;
    public sampleMask?: number;
    public alphaToCoverageEnabled?: boolean;

    public cColorStates: Array<GPUColorStateDescriptor>;
    public cDepthStencilState?: GPUDepthStencilStateDescriptor;
    public cRasterizationState?: GPURasterizationStateDescriptor;

    private _colorStateCount: uint32_t = 0;

    constructor(device: GPUDevice) {
        const descriptor = this;

        descriptor.primitiveTopology = "triangle-list";
        descriptor.sampleCount = 1;

        // Set defaults for the vertex stage descriptor.
        descriptor.vertexStage = <GPUProgrammableStageDescriptor> {
            entryPoint: "main"
        };

        // Set defaults for the fragment stage desriptor.
        descriptor.fragmentStage = <GPUProgrammableStageDescriptor> {
            entryPoint: "main"
        };

        // Set defaults for the rasterization state descriptor.
        this.cRasterizationState = <GPURasterizationStateDescriptor> {
            frontFace: "ccw",
            cullMode: "none",
            depthBias: 0,
            depthBiasSlopeScale: 0.0,
            depthBiasClamp: 0.0
        };
        descriptor.rasterizationState = this.cRasterizationState;

        // Set defaults for the color state descriptors.
        const blend: GPUBlendDescriptor = {
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
        };
        this.cColorStates = BuildArray(
            ComboRenderPipelineDescriptor.kMaxColorAttachments,
            () => <GPUColorStateDescriptor> {
                format: "rgba8unorm",
                alphaBlend: blend,
                colorBlend: blend,
                writeMask: GPUColorWrite.ALL
            }
        );
        descriptor.colorStateCount = 1;
        
        // Set defaults for the depth stencil state descriptors.
        const stencilFace: GPUStencilStateFaceDescriptor = {
            compare: "always",
            failOp: "keep",
            depthFailOp: "keep",
            passOp: "keep"
        };

        this.cDepthStencilState = <GPUDepthStencilStateDescriptor> {
            format: "depth24plus-stencil8",
            depthWriteEnabled: false,
            depthCompare: "always",
            stencilBack: stencilFace,
            stencilFront: stencilFace,
            stencilReadMask: 0xff,
            stencilWriteMask: 0xff
        };
        descriptor.depthStencilState = undefined;
    }

    public set colorStateCount(value: uint32_t) {
        this._colorStateCount = value;
        this.colorStates = this.cColorStates.slice(0, this._colorStateCount);
    }

}

export class ComboVertexStateDescriptor implements GPUVertexStateDescriptor {

    public static readonly kMaxVertexAttributes: size_t = 16;
    public static readonly kMaxVertexBuffers: size_t    = 16;

    public cVertexBuffers: Array<GPUVertexBufferLayoutDescriptor>;
    public cAttributes: Array<GPUVertexAttributeDescriptor>;

    public indexFormat?: GPUIndexFormat;
    public vertexBuffers?: Iterable<GPUVertexBufferLayoutDescriptor>;

    private _vertexBufferCount: size_t = 0;

    public constructor() {
        const descriptor = this;

        this.cVertexBuffers = BuildArray<GPUVertexBufferLayoutDescriptor>(
            ComboVertexStateDescriptor.kMaxVertexBuffers, () => <GPUVertexBufferLayoutDescriptor>{}
        );

        this.cAttributes = BuildArray<GPUVertexAttributeDescriptor>(
            ComboVertexStateDescriptor.kMaxVertexAttributes, () => <GPUVertexAttributeDescriptor>{}
        );

        descriptor.indexFormat = "uint32";
        descriptor._vertexBufferCount = 0;

        // Fill the default values for vertexBuffers and vertexAttributes in buffers.
        for (let i: uint32_t = 0; i < this.cAttributes.length; ++i) {
            this.cAttributes[i] = <GPUVertexAttributeDescriptor> {
                shaderLocation: 0,
                offset: 0,
                format: 'float'
            };
        }
        for (let i = 0; i < this.cVertexBuffers.length; ++i) {
            this.cVertexBuffers[i].arrayStride = 0;
            this.cVertexBuffers[i].stepMode = "vertex";
            this.cVertexBuffers[i].attributes = [];
        }
        // cVertexBuffers[i].attributes points to somewhere in cAttributes.
        // cVertexBuffers[0].attributes points to &cAttributes[0] by default. Assuming
        // cVertexBuffers[0] has two attributes, then cVertexBuffers[1].attributes should point to
        // &cAttributes[2]. Likewise, if cVertexBuffers[1] has 3 attributes, then
        // cVertexBuffers[2].attributes should point to &cAttributes[5].
        this.cVertexBuffers[0].attributes = this.cAttributes;
        descriptor.vertexBuffers = this.cVertexBuffers;
    }

    public set vertexBufferCount(value: size_t) {
        this._vertexBufferCount = value;
        this.vertexBuffers = this.cVertexBuffers.slice(0, this._vertexBufferCount);
    }

}
