import { BuildArray, int, double, float, size_t } from "./types";

/**
 * Defines the fps timer.
 */
export class FPSTimer {

    public static readonly NUM_HISTORY_DATA: int      = 100;
    public static readonly NUM_FRAMES_TO_AVERAGE: int = 128;
    public static readonly FPS_VALID_THRESHOLD: int   = 5;

    private _totalTime: double;
    private _timeTable: double[];
    private _timeTableCursor: int;

    private _historyFPS: float[];
    private _historyFrameTime: float[];
    private _logFPS: float[];

    private _averageFPS: double;
    private _averageFrameTime: double;

    constructor() {
        this._totalTime = FPSTimer.NUM_FRAMES_TO_AVERAGE * 1.0;
        this._timeTable = BuildArray(FPSTimer.NUM_FRAMES_TO_AVERAGE, () => 1.0);;
        this._timeTableCursor = 0;
        this._historyFPS = BuildArray(FPSTimer.NUM_HISTORY_DATA, () => 1.0);
        this._historyFrameTime = BuildArray(FPSTimer.NUM_HISTORY_DATA, () => 100.0);
        this._logFPS = [];
        this._averageFPS = 0.0;
        this._averageFrameTime = 0.0;
    }

    public get averageFPS(): double {
        return this._averageFPS;
    }

    public get historyFPS(): float[] {
        return this._historyFPS;
    }

    public get averageFrameTime(): float {
        return this._averageFrameTime;
    }

    public get historyFrameTime(): float[] {
        return this._historyFrameTime;
    }

    public update(elapsedTime: double, renderingTime: double, testTime: int): void {
        this._totalTime += elapsedTime - this._timeTable[this._timeTableCursor];
        this._timeTable[this._timeTableCursor] = elapsedTime;

        this._timeTableCursor++;
        if (this._timeTableCursor === FPSTimer.NUM_FRAMES_TO_AVERAGE) {
            this._timeTableCursor = 0;
        }

        this._averageFPS = Math.floor((1.0 / (this._totalTime / (FPSTimer.NUM_FRAMES_TO_AVERAGE * 1.0))) + 0.5);

        for (let i: int = 0; i < FPSTimer.NUM_HISTORY_DATA; ++i) {
            this._historyFPS[i]       = this._historyFPS[i + 1];
            this._historyFrameTime[i] = this._historyFrameTime[i + 1];
        }
        this._historyFPS[FPSTimer.NUM_HISTORY_DATA - 1]       = this._averageFPS;
        this._historyFrameTime[FPSTimer.NUM_HISTORY_DATA - 1] = 1000.0 / this._averageFPS;

        this._averageFrameTime = this._historyFrameTime[FPSTimer.NUM_HISTORY_DATA - 1];

        if (testTime - renderingTime > 5 && testTime - renderingTime < 25) {
            this._logFPS.push(this._averageFPS);
        }
    }

    public variance(): int {
        let avg: float = 0.0;

        for (let i: size_t = 0; i < this._logFPS.length; ++i) {
            avg += this._logFPS[i];
        }
        avg /= this._logFPS.length;

        let variance: float = 0.0;
        for (let i: size_t = 0; i < this._logFPS.length; i++) {
            variance += Math.pow(this._logFPS[i] - avg, 2);
        }
        variance /= this._logFPS.length;

        if (variance < FPSTimer.FPS_VALID_THRESHOLD) {
            return Math.ceil(avg);
        }

        return 0;
    }

}