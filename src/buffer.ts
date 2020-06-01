/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

import { Nullable, int, size_t, uint32_t, MergeTypedArrays } from "./types";
import { ContextWebGPU } from "./context";

/**
 * Defines the abstract Buffer Class.
 */
export class Buffer {

    public dispose(): void { }

}

/**
 * Defines the buffer wrapper of WebGPU, abstracting the vertex and index buffer binding.
 */
export class BufferWebGPU implements Buffer {

    private _buf: GPUBuffer;
    private _usage: GPUBufferUsageFlags;
    private _totalComponents: size_t;
    private _stride: size_t = 0;
    private _offset: int = 0;
    private _size: size_t = 0;

    constructor(context: Nullable<ContextWebGPU>,
                totalComponents: int,
                numComponents: int,
                buffer: Float32Array | Uint16Array,
                isIndex: boolean) {
        this._usage = isIndex ? GPUBufferUsage.INDEX : GPUBufferUsage.VERTEX;
        this._totalComponents = totalComponents

        if (buffer instanceof Float32Array) {
            const sizeOfFloat: size_t = buffer.BYTES_PER_ELEMENT; // float size => 4 bytes
            this._size = numComponents * sizeOfFloat;
            // Create buffer for vertex buffer. Because float is multiple of 4 bytes, dummy padding isnt' needed.
            const bufferSize: uint32_t = sizeOfFloat * buffer.length;
            this._buf                  = context.createBuffer(bufferSize, this._usage | GPUBufferUsage.COPY_DST);

            context.setBufferData(this._buf, 0, bufferSize, buffer);
        }
        else if (buffer instanceof Uint16Array) {
            const sizeOfUint16: size_t = buffer.BYTES_PER_ELEMENT; // Uint16 size => 2 bytes
            this._size = numComponents * sizeOfUint16;
            // Create buffer for index buffer. Because unsigned short is multiple of 2 bytes, in order to align
            // with 4 bytes of dawn metal, dummy padding need to be added.
            if (this._totalComponents % 2 !== 0)
            {
                const dummyPadding: Uint16Array = new Uint16Array([0.0]);
                buffer = MergeTypedArrays(buffer, dummyPadding);
            }

            const bufferSize: uint32_t = sizeOfUint16 * buffer.length;
            this._buf                  = context.createBuffer(bufferSize, this._usage | GPUBufferUsage.COPY_DST);

            context.setBufferData(this._buf, 0, bufferSize, buffer);
        }
    }

    public dispose(): void {
        this._buf = null;
    }

    public get buffer(): GPUBuffer {
        return this._buf;
    }

    public get totalComponents(): size_t {
        return this._totalComponents;
    }

    public get stride(): size_t {
        return this._stride;
    }

    public get offset(): int {
        return this._offset;
    }

    public get usageBit(): GPUBufferUsageFlags {
        return this._usage;
    }

    public get dataSize(): int {
        return this._size;
    }

}