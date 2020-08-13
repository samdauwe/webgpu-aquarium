import { float, int } from "./types";

/**
 * Defines the base class for Behavior of specific backends.
 */
export class Behavior {

    private _frame: int;
    private _op: string;
    private _count: int;

    constructor(frame: int, op: string, count: int) {
        this._frame = frame;
        this._op    = op;
        this._count = count;
    }

    public get frame(): int {
        return this._frame;
    }

    public set frame(frame: int) {
        this._frame = frame
    }

    public get op(): string {
        return this._op;
    }

    public get count(): int {
        return this._count;
    }

}