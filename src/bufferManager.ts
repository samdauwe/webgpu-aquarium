import { ASSERT, Nullable, int, size_t } from "./types";
import { ContextWebGPU } from "./context";

/**
 * Defines an abstract RingBuffer Class.
 */
export class RingBuffer {

    protected _head: size_t = 0;
    protected _tail: size_t = 0;
    protected _size: size_t = 0;

    constructor(size: size_t) {
        this._tail = size;
        this._size = size;
    }

    public dispose(): void { }

    public get size(): size_t {
        return this._size;
    }

    public get availableSize(): size_t {
        return this._size - this._tail;
    }

    public reset(size: size_t): boolean {
        return false;
    }

    public flush() {}
    public destroy() {}

    /**
     * Allocate size in a RingBuffer, return offset of the buffer.
     */
    public allocate(size: size_t): size_t {
        return 0;
    }

}

export class RingBufferWebGPU extends RingBuffer {

    private _bufferMappedResultBuffer: GPUBuffer;
    private _pixels: ArrayBuffer;

    public bufferManager: Nullable<BufferManagerWebGPU> = null;
    
    constructor(bufferManager: Nullable<BufferManagerWebGPU>, size: size_t) {
        super(size);
        this.bufferManager = bufferManager;

        this.reset(size);
    }

    public set mappedData(data: [GPUBuffer, ArrayBuffer]) {
        this._bufferMappedResultBuffer = data[0];
        this._pixels = data[1];
    }

    public push(encoder: GPUCommandEncoder,
                destBuffer: GPUBuffer,
                src_offset: size_t,
                dest_offset: size_t,
                pixels: Float32Array | Uint16Array,
                size: size_t): boolean {
        const writeArray = pixels instanceof Uint16Array ? new Uint16Array(this._pixels) : new Float32Array(this._pixels);
        writeArray.set(pixels);
        
        encoder.copyBufferToBuffer(this._bufferMappedResultBuffer, src_offset, destBuffer, dest_offset,
                                   size);
        return true;
    }

    /**
     * Reset current buffer and reuse the buffer.
     */
    public reset(size: size_t): boolean {
        if (size > this.size) {
            return false;
        }

        this._head = 0;
        this._tail = 0;

        let [resultBuffer, resultData] = this.bufferManager.context.createBufferMapped(GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC, size);
        this._bufferMappedResultBuffer = resultBuffer;
        this._pixels = resultData;

        return true;
    }

    public static MapWriteCallback(data: [GPUBuffer, ArrayBuffer], ringBuffer: Nullable<RingBufferWebGPU>): void {
        ASSERT(data !== null, "Invalid data in MapWriteCallback function.")

        ringBuffer.mappedData = data;
        ringBuffer.bufferManager.mappedBufferList.push(ringBuffer);
    }

    public flush(): void {
        this._head = 0;
        this._tail = 0;

        this._bufferMappedResultBuffer.unmap();
    }

    public destroy() {
        this._bufferMappedResultBuffer = null;
    }

    public reMap() {      
        this._bufferMappedResultBuffer.mapWriteAsync().then((mappedArray) => {
            RingBufferWebGPU.MapWriteCallback([this._bufferMappedResultBuffer, mappedArray], this);
        });
    }

    public allocate(size: size_t): size_t {
        this._tail += size;
        ASSERT(this._tail < this._size, "Unable to allocate the requested memory size.");

        return this._tail - size;
    }
}

/**
 * Implements a buffer pool to manage buffer allocation and recycle.
 */
export class BufferManager {

    public static readonly BUFFER_POOL_MAX_SIZE: size_t    = 409600000;
    public static readonly BUFFER_MAX_COUNT: size_t        = 10;
    public static readonly BUFFER_PER_ALLOCATE_SIZE: size_t = BufferManager.BUFFER_POOL_MAX_SIZE / BufferManager.BUFFER_MAX_COUNT;

    public mappedBufferList: Array<Nullable<RingBuffer>> = new Array<Nullable<RingBuffer>>();
    
    protected _enqueuedBufferList: Array<Nullable<RingBuffer>> = new Array<Nullable<RingBuffer>>();
    protected _bufferPoolSize: size_t;
    protected _usedSize: size_t;
    protected _count: size_t;

    constructor() {
        this._bufferPoolSize = BufferManager.BUFFER_POOL_MAX_SIZE;
    }

    public dispose(): void {
        this.destroyBufferPool();
    }

    public get size(): size_t {
        return this._bufferPoolSize;
    }

    public resetBuffer(ringBuffer: Nullable<RingBuffer>, size: size_t): boolean {
        const index: int = this._find(ringBuffer);
        
        if (index === -1) {
            return false;
        }
        
        const oldSize: size_t = ringBuffer.size;

        const result: boolean = ringBuffer.reset(size);
        // If the size is larger than the ring buffer size, reset fails and the ring
        // buffer retains.
        // If the size is equal or smaller than the ring buffer size, reset success
        // and the used size need to be updated.
        if (!result) {
            return false;
        }
        else {
            this._usedSize = this._usedSize - oldSize + size;
        }

        return true;
    }

    public destroyBuffer(ringBuffer: Nullable<RingBuffer>): boolean {
        const index: int = this._find(ringBuffer);

        if (index === -1) {
            return false;
        }

        this._usedSize -= ringBuffer.size;
        ringBuffer.destroy();
        this._enqueuedBufferList.splice(index, 1);

        return true;
    }

    private _find(ringBuffer: Nullable<RingBuffer>): int {
        if (this._enqueuedBufferList.length > 0) {
            return this._enqueuedBufferList.indexOf(ringBuffer);
        }
        return -1;
    }

    public destroyBufferPool(): void { }

    /**
     * Flush copy commands in buffer pool
     */
    public flush(): void {
        for (let buffer of this._enqueuedBufferList) {
            buffer.flush();
        }
    }

    /**
     * Allocate new buffer from buffer pool. 
     */
    public allocate(size: size_t, offset: size_t): {buffer: Nullable<RingBuffer>, offset: size_t} {
        return null;
    }

}

export class BufferManagerWebGPU extends BufferManager {

    public encoder: GPUCommandEncoder;
    public context: Nullable<ContextWebGPU> = null;
    public sync;

    constructor(context: Nullable<ContextWebGPU>, sync: boolean) {
        super();
        this.context = context;
        this.sync = sync;

        this.encoder = context.createCommandEncoder();
    }

    public dispose() {
        this.encoder = null;
    }

    /**
     * Allocate new buffer from buffer pool. 
     */
    public allocate(size: size_t, offset: size_t): {buffer: Nullable<RingBufferWebGPU>, offset: size_t} {
        // If update data by sync method, create new buffer to upload every frame.
        // If updaye data by async method, get new buffer from pool if available. If no available
        // buffer and size is enough in the buffer pool, create a new buffer. If size reach the
        // limit of the buffer pool, force wait for the buffer on mapping.
        // Get the last one and check if the ring buffer is full. If the buffer can hold extra
        // size space, use the last one directly.
        
        let ringBuffer: Nullable<RingBufferWebGPU> = null;
        let cur_offset: size_t               = 0;
        if (this.sync) {
            // Upper limit
            if (this._usedSize + size > this._bufferPoolSize) {
                return {
                    buffer: ringBuffer,
                    offset: offset
                };
            }

            ringBuffer = new RingBufferWebGPU(this, size);
            this._enqueuedBufferList.push(ringBuffer);
        }
        else {  // Buffer mapping async
            while (this.mappedBufferList.length > 0) {
                ringBuffer = this.mappedBufferList[0] as Nullable<RingBufferWebGPU>;
                if (ringBuffer.availableSize < size) {
                    this.mappedBufferList.shift(),
                    ringBuffer = null;
                }
                else {
                    break;
                }
            }

            if (ringBuffer == null) {
                if (this._count < BufferManager.BUFFER_MAX_COUNT) {
                    this._usedSize += size;
                    ringBuffer = new RingBufferWebGPU(this, BufferManager.BUFFER_PER_ALLOCATE_SIZE);
                    this.mappedBufferList.push(ringBuffer);
                    this._count++;
                }
                else if (this.mappedBufferList.length + this._enqueuedBufferList.length < this._count) {
                    // Force wait for the buffer remapping
                    while (this.mappedBufferList.length === 0) {
                        this.context.waitABit();
                    }

                    ringBuffer = this.mappedBufferList[0] as Nullable<RingBufferWebGPU>;
                    if (ringBuffer.availableSize < size) {
                        this.mappedBufferList.shift();
                        ringBuffer = null;
                    }
                }
                else { // Upper limit
                    return null;
                }
            }

            if (this._enqueuedBufferList.length === 0
                || this._enqueuedBufferList[this._enqueuedBufferList.length-1] != ringBuffer) {
                this._enqueuedBufferList.push(ringBuffer);
            }

            // allocate size in the ring buffer
            cur_offset = ringBuffer.allocate(size);
            offset = cur_offset;
        }

        return {
            buffer: ringBuffer,
            offset: offset
        };
    }

    public flush(): void {
        // The front buffer in MappedBufferList will be remap after submit, pop the buffer from
        // MappedBufferList.
        if (this.mappedBufferList.length > 0
            && this._enqueuedBufferList[this._enqueuedBufferList.length-1] === this.mappedBufferList[0]) {
            this.mappedBufferList.shift(); // Stack pop
        }

        for (let buffer of this._enqueuedBufferList) {
            buffer.flush();
        }

        const copy: GPUCommandBuffer = this.encoder.finish();
        this.context.queue.submit([copy]);

        // Async function
        if (!this.sync) {
            for (let index: size_t = 0; index < this._enqueuedBufferList.length; ++index) {
                const ringBuffer: Nullable<RingBufferWebGPU> = this._enqueuedBufferList[index] as Nullable<RingBufferWebGPU>;
                ringBuffer.reMap();
            }
        }
        else {
            // All buffers are used once in buffer sync mode.
            for (let index: size_t = 0; index < this._enqueuedBufferList.length; ++index) {
                const ringBuffer: Nullable<RingBufferWebGPU> = this._enqueuedBufferList[index] as Nullable<RingBufferWebGPU>;
                ringBuffer.dispose();
            }
            this._usedSize = 0;
        }

        this._enqueuedBufferList.length = 0;
        this.encoder = this.context.createCommandEncoder();
    }

    public destroyBufferPool(): void {
        if (!this.sync) {
            return;
        }

        for (let ringBuffer of this._enqueuedBufferList) {
            ringBuffer.destroy();
        }
        this._enqueuedBufferList.length = 0;
    }

}