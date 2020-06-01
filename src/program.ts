/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

import { Nullable } from "./types";
import { ContextWebGPU, SingleShaderStage } from "./context";
import { IO } from "./io";

/**
 * Define base class for Programs of specific backends.
 */
export class Program {

    protected _vertexShaderCodePath: string;
    protected _fragmentShaderCodePath: string;

    protected _vertexShaderCode: string;
    protected _fragmentShaderCode: string;

    constructor(vertexShaderCodePath?: string, fragmentShaderCodePath?: string) {
        if (vertexShaderCodePath) {
            this._vertexShaderCodePath = vertexShaderCodePath;
        }

        if (fragmentShaderCodePath) {
            this._fragmentShaderCodePath = fragmentShaderCodePath;
        }
    }

    public get vertexShaderCode(): string {
        return this._vertexShaderCode;
    }

    public set vertexShaderCode(value: string) {
        this._vertexShaderCode = value;
    }

    public get fragmentShaderCode(): string {
        return this._fragmentShaderCode;
    }

    public set fragmentShaderCode(value: string) {
        this._fragmentShaderCode = value;
    }

    public dispose(): void { }
    public setProgram(): void {}
    public async compileProgram(enableAlphaBlending?: boolean, alpha?: string): Promise<void> { }

    protected async loadProgram(): Promise<boolean> {
        const promises = new Array<Promise<any>>();

        // Shader loading helper function
        const loadshader = (shaderPath: string, stage: SingleShaderStage) => {
            promises.push(new Promise((resolve, reject) => {
                IO.LoadTextFile(shaderPath, (result: string, exception: string) => {
                    if (exception) {
                        console.error("Unable to load shader: " + exception);
                        reject(exception);
                    }
                    switch(stage) {
                        case SingleShaderStage.Vertex:
                            this._vertexShaderCode = result;
                            resolve();
                            break;
                        case SingleShaderStage.Fragment:
                            this._fragmentShaderCode = result;
                            resolve();
                            break;
                        default:
                            reject("Unsupported stage: " + stage);
                    }
                });
            }));
        };

        // Vertex and Fragment shader loading promise
        loadshader(this._vertexShaderCodePath, SingleShaderStage.Vertex);
        loadshader(this._fragmentShaderCodePath, SingleShaderStage.Fragment);

        return Promise.all(promises)
                .then(() => {return true;})
                .catch(() => {
                    console.error("Unable to load program.");
                    return false;
                });
    }
}

/**
 * Defines the Program wrapper of WebGPU.
 */
export class ProgramWebGPU extends Program {

    public _vertexShaderModule: GPUShaderModule;
    public _fragmentShaderModule: GPUShaderModule;

    private _context: Nullable<ContextWebGPU> = null;

    constructor(context: Nullable<ContextWebGPU>, vertexShaderCodePath?: string, fragmentShaderCodePath?: string) {
        super(vertexShaderCodePath, fragmentShaderCodePath);
        this._context = context;
    }

    public dispose(): void {
        this._vertexShaderModule = null;
        this._fragmentShaderModule = null;

        super.dispose();
    }

    public async compileProgram(enableBlending?: boolean, alpha?: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.loadProgram().then((success: boolean) => {
                if (success) {
                    this._fragmentShaderCode = this._fragmentShaderCode.replace(/^.*?\/\/ #noReflection$/gm, "");
                    this._fragmentShaderCode = this._fragmentShaderCode.replace(/^.*?\/\/ #noNormalMap$/gm, "");
    
                    if (enableBlending) {
                        this._fragmentShaderCode = this._fragmentShaderCode.replace(/diffuseColor.a/gm, alpha);
                    }
    
                    this._vertexShaderModule = this._context.createShaderModule(SingleShaderStage.Vertex, this._vertexShaderCode);
                    this._fragmentShaderModule = this._context.createShaderModule(SingleShaderStage.Fragment, this._fragmentShaderCode);
                    resolve();
                }
                else {
                    console.error("Unable to compile shader code.");
                    reject();
                }
            });
        });
    }

    public get vertexShaderModule(): Nullable<GPUShaderModule> {
        return this._vertexShaderModule;
    }

    public get fragmentShaderModule(): Nullable<GPUShaderModule> {
        return this._fragmentShaderModule;
    }

}