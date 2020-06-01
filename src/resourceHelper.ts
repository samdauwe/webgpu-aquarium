import { size_t } from "./types";

const slash: string          = "/";
const shaderFolder: string   = "../shaders";
const resourceFolder: string = "../assets";
const skyBoxUrls: string[]   = [
    "GlobeOuter_EM_positive_x.jpg", "GlobeOuter_EM_negative_x.jpg",
    "GlobeOuter_EM_positive_y.jpg", "GlobeOuter_EM_negative_y.jpg",
    "GlobeOuter_EM_positive_z.jpg", "GlobeOuter_EM_negative_z.jpg"
];

export class ResourceHelper {

    private _path: string;
    private _imagePath: string;
    private _programPath: string;
    private _propPlacementPath: string;
    private _fishBehaviorPath: string;

    constructor(path) {
        this._path = path;
        this._imagePath = this._path + resourceFolder + slash;
        this._programPath = this._path + shaderFolder + slash ;
        this._propPlacementPath = this._path + resourceFolder + slash + "PropPlacement.js";
        this._fishBehaviorPath = this._path + "FishBehavior.json";
    }

    public get imagePath(): string {
        return this._imagePath;
    }

    public get programPath(): string {
        return this._programPath;
    }

    public get propPlacementPath(): string {
        return this._propPlacementPath;
    }

    public get fishBehaviorPath(): string {
        return this._fishBehaviorPath;
    }

    public getSkyBoxUrls(): string[] {
        let skyUrls: string[] = [];
        for (let i: size_t = 0; i < skyBoxUrls.length; ++i) {
            const url = this._path + resourceFolder + slash + skyBoxUrls[i];
            skyUrls.push(url);
        }
        return skyUrls
    }

    public getModelPath(modelName: string): string {
        return this._imagePath + modelName + ".js";
    }

}