import { float, size_t, BuildArray, uint32_t } from "./types";


export class FishPer {

    public static readonly kWorldPosition: size_t = 3;
    public static readonly kNextPosition: size_t = 3;

    public worldPosition: Array<float>;
    public scale: float;
    public nextPosition: Array<float>;
    public time: float;

    constructor() {
        this.worldPosition = BuildArray(FishPer.kWorldPosition, () => 0.0)
        this.nextPosition  = BuildArray(FishPer.kNextPosition, () => 0.0)
    }

    public static toArray(fishPers: Array<FishPer>): Array<float> {
        let arr: Array<float> = [];
        for (let i = 0; i < fishPers.length; ++i) {
            arr = arr.concat(fishPers[i].getAsArray());
        }
        return arr;
    }

    public getAsArray(): Array<float> {
        return this.worldPosition.concat(this.scale, this.nextPosition, this.time);
    }

    public static offsetof(attributeName: string): size_t {
        let offset: size_t = 0;
        switch(attributeName) {
            case "worldPosition":
                offset = 0;
                break;
            case "scale":
                offset = FishPer.kWorldPosition;
                break;
            case "nextPosition":
                offset = FishPer.kWorldPosition + 1;
                break;
            case "time":
                offset = FishPer.kWorldPosition + 1 + FishPer.kNextPosition;
                break;
        }
        return offset * 4; // sizeof(float) = 4
    }

    public get data(): Float32Array {
        return new Float32Array(this.getAsArray());
    }

    public static get byteSize(): size_t {
        return (FishPer.kWorldPosition + 1 + FishPer.kNextPosition + 1) * 4;
    }
}

export class FishPerWithPadding {

    public static readonly kWorldPosition: size_t = 3;
    public static readonly kNextPosition: size_t = 3;
    public static readonly kPadding: size_t = 56;

    public worldPosition: Array<float>;
    public scale: float;
    public nextPosition: Array<float>;
    public time: float;
    public padding: Array<float>;

    constructor() {
        this.worldPosition = BuildArray(FishPerWithPadding.kWorldPosition, () => 0.0)
        this.nextPosition  = BuildArray(FishPerWithPadding.kNextPosition, () => 0.0)
        this.padding  = BuildArray(FishPerWithPadding.kPadding, () => 0.0)
    }

    public getAsArray(): Array<float> {
        return this.worldPosition.concat(this.scale, this.nextPosition, this.time, this.padding);
    }

    public get data(): Float32Array {
        return new Float32Array(this.getAsArray());
    }

    public static get byteSize(): size_t {
        return (FishPer.kWorldPosition + 1 + FishPer.kNextPosition + 1 + FishPerWithPadding.kPadding) * 4;
    }
}

/**
 * Defines the fish vertex uniforms of the fish model of WebGPU.
 */
export class FishVertexUniforms {

    public static readonly kUniforms: size_t = 3;

    // Uniforms array: [fishLength, fishWaveLength, fishBendAmount]
    public uniforms: Array<float>;

    constructor() {
        this.uniforms = BuildArray(FishVertexUniforms.kUniforms, () => 0.0);
    }

    public get fishLength(): float {
        return this.uniforms[0];
    }

    public set fishLength(value: float) {
        this.uniforms[0] = value;
    }

    public get fishWaveLength(): float {
        return this.uniforms[1];
    }

    public set fishWaveLength(value: float) {
        this.uniforms[1] = value;
    }

    public get fishBendAmount(): float {
        return this.uniforms[2];
    }

    public set fishBendAmount(value: float) {
        this.uniforms[2] = value;
    }

    public get data() {
        return new Float32Array(this.uniforms);
    }

    public static get byteSize() {
        return FishVertexUniforms.kUniforms * 4;
    }
}

export class FogUniforms {

    public static readonly kUniforms: size_t = 8;

    // Uniforms array: [fogPower, fogMult, fogOffset, padding, fogColor[4]]
    public uniforms: Array<float>;

    constructor() {
        this.uniforms = BuildArray(FogUniforms.kUniforms, () => 0.0);
    }

    public get fogPower(): float {
        return this.uniforms[0];
    }

    public set fogPower(value: float) {
        this.uniforms[0] = value;
    }

    public get fogMult(): float {
        return this.uniforms[1];
    }

    public set fogMult(value: float) {
        this.uniforms[1] = value;
    }

    public get fogOffset(): float {
        return this.uniforms[2];
    }

    public set fogOffset(value: float) {
        this.uniforms[2] = value;
    }

    public get padding(): float {
        return this.uniforms[3];
    }

    public set padding(value: float) {
        this.uniforms[3] = value;
    }

    public get fogColor(): Array<float> {
        return this.uniforms.slice(4);
    }

    public set fogColor(value: Array<float>) {
        this.uniforms[4] = value[0];
        this.uniforms[5] = value[1];
        this.uniforms[6] = value[2];
        this.uniforms[7] = value[3];
    }

    public get data() {
        return new Float32Array(this.uniforms);
    }

    public static get byteSize() {
        return FogUniforms.kUniforms * 4;
    }
}

/**
 * Defines the inner uniforms.
 */
export class InnerUniforms {

    public static readonly kUniforms: size_t = 4;

    // Uniforms array: [eta, tankColorFudge, refractionFudge, padding]
    public uniforms: Array<float>;

    constructor() {
        this.uniforms = BuildArray(InnerUniforms.kUniforms, () => 0.0);
    }

    public get eta(): float {
        return this.uniforms[0];
    }

    public set eta(value: float) {
        this.uniforms[0] = value;
    }

    public get tankColorFudge(): float {
        return this.uniforms[1];
    }

    public set tankColorFudge(value: float) {
        this.uniforms[1] = value;
    }

    public get refractionFudge(): float {
        return this.uniforms[2];
    }

    public set refractionFudge(value: float) {
        this.uniforms[2] = value;
    }

    public get padding(): float {
        return this.uniforms[3];
    }

    public set padding(value: float) {
        this.uniforms[3] = value;
    }

    public get data(): Float32Array {
        return new Float32Array(this.uniforms);
    }

    public static get byteSize(): size_t {
        return InnerUniforms.kUniforms * 4;
    }
}

/**
 * Defines the light factor uniforms.
 */
export class LightFactorUniforms {

    public static readonly kUniforms: size_t = 2;

    // Uniforms array: [shininess, specularFactor]
    public uniforms: Array<float>;

    constructor() {
        this.uniforms = BuildArray(LightFactorUniforms.kUniforms, () => 0.0);
    }

    public get shininess(): float {
        return this.uniforms[0];
    }

    public set shininess(value: float) {
        this.uniforms[0] = value;
    }

    public get specularFactor(): float {
        return this.uniforms[1];
    }

    public set specularFactor(value: float) {
        this.uniforms[1] = value;
    }

    public get data(): Float32Array {
        return new Float32Array(this.uniforms);
    }

    public static get byteSize(): size_t {
        return LightFactorUniforms.kUniforms * 4;
    }
}

export class LightUniforms {

    public static readonly kLightColor: size_t = 4;
    public static readonly kSpecular: size_t = 4;
    public static readonly kAmbient: size_t = 4;

    public lightColor: Array<float>;
    public specular: Array<float>;
    public ambient: Array<float>;

    constructor() {
        this.lightColor = BuildArray(LightUniforms.kLightColor, () => 0.0);
        this.specular = BuildArray(LightUniforms.kSpecular, () => 0.0);
        this.ambient = BuildArray(LightUniforms.kAmbient, () => 0.0);
    }

    public getAsArray(): Array<float> {
        return this.lightColor.concat(this.specular, this.ambient);
    }

    public get data(): Float32Array {
        return new Float32Array(this.getAsArray());
    }

    public static get byteSize(): size_t {
        return (LightUniforms.kLightColor + LightUniforms.kSpecular + LightUniforms.kAmbient) * 4;
    }
}

export class LightWorldPositionUniform {

    public static readonly kLightWorldPos: size_t = 3;
    public static readonly kViewProjection: size_t = 16;
    public static readonly kViewInverse: size_t = 16;

    public lightWorldPos: Array<float>;
    public padding: float;
    public viewProjection: Array<float>;
    public viewInverse: Array<float>;

    constructor() {
        this.lightWorldPos = BuildArray(LightWorldPositionUniform.kLightWorldPos, () => 0.0);
        this.padding = 0;
        this.viewProjection  = BuildArray(LightWorldPositionUniform.kViewProjection, () => 0.0);
        this.viewInverse  = BuildArray(LightWorldPositionUniform.kViewInverse, () => 0.0);
    }

    public getAsArray(): Array<float> {
        return this.lightWorldPos.concat(this.padding, this.viewProjection, this.viewInverse);
    }

    public get data(): Float32Array {
        return new Float32Array(this.getAsArray());
    }

    public static get byteSize(): size_t {
        return (LightWorldPositionUniform.kLightWorldPos + 1 + LightWorldPositionUniform.kViewProjection + LightWorldPositionUniform.kViewInverse) * 4;
    }
}

export class SeaweedPer {

    // Uniforms array: [time]
    public uniforms: Array<float>;

    constructor() {
        this.uniforms = BuildArray(
            20, () => 0.0
        );
    }

    public get time(): Array<float> {
        return this.uniforms;
    }

    public set time(value: Array<float>) {
        this.uniforms = value;
    }

    public get data(): Float32Array {
        return new Float32Array(this.uniforms);
    }

    public get byteSize(): size_t {
        return this.uniforms.length * 4;
    }
}

export class WorldUniforms {

    public static readonly kWorld: size_t = 16;
    public static readonly kWorldInverseTranspose: size_t = 16;
    public static readonly kWorldViewProjection: size_t = 16;

    public world: Array<float>;
    public worldInverseTranspose: Array<float>;
    public worldViewProjection: Array<float>;

    constructor() {
        this.world = BuildArray(WorldUniforms.kWorld, () => 0.0);
        this.worldInverseTranspose = BuildArray(WorldUniforms.kWorldInverseTranspose, () => 0.0);
        this.worldViewProjection = BuildArray(WorldUniforms.kWorldViewProjection, () => 0.0);
    }

    public getAsArray(): Array<float> {
        return this.world.concat(this.worldInverseTranspose, this.worldViewProjection);
    }

    public get data(): Float32Array {
        return new Float32Array(this.getAsArray());
    }

    public static get byteSize(): size_t {
        return (WorldUniforms.kWorld + WorldUniforms.kWorldInverseTranspose + WorldUniforms.kWorldViewProjection) * 4;
    }
    
    public clone(): WorldUniforms {
        const clone: WorldUniforms = new WorldUniforms();
        clone.world = this.world.slice();
        clone.worldInverseTranspose = this.worldInverseTranspose.slice();
        clone.worldViewProjection = this.worldViewProjection.slice();
        return clone;
    }

}

export class WorldUniformPer {

    // Uniforms array: [worldUniforms..]
    public worldUniforms: Array<WorldUniforms>;

    constructor() {
        this.worldUniforms = BuildArray(
            20, () => new WorldUniforms()
        );
    }

    public get data(): Float32Array {
        let arr: Array<float> = [];
        for (let i: size_t = 0; i < this.worldUniforms.length; ++i) {
            arr = arr.concat(this.worldUniforms[i].getAsArray());
        }
        return new Float32Array(arr);
    }

    public get byteSize(): size_t {
        return WorldUniforms.byteSize * this.worldUniforms.length;
    }
}