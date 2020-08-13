import { ASSERT, BuildArray, Nullable, double, float, FloatArray, int, size_t, uint32_t } from "./types";

import { Behavior } from "./behavior";
import { Buffer } from "./buffer";
import { Context, ContextWebGPU } from "./context";
import { FPSTimer } from "./fpsTimer";
import { IO } from "./io";
import { Program } from "./program";
import { Matrix } from "./matrix";
import { Model, FishModel } from "./model";
import { ResourceHelper } from "./resourceHelper";
import { Texture } from "./texture";
import { FogUniforms, LightWorldPositionUniform, LightUniforms, WorldUniforms } from "./uniforms";

/**
 * Define global variables, enums, constant variables and Class Aquarium.
 */

export enum MODELNAME {
    MODELFIRST,
    MODELRUINCOlOMN,
    MODELARCH,
    MODELROCKA,
    MODELROCKB,
    MODELROCKC,
    MODELSUNKNSHIPBOXES,
    MODELSUNKNSHIPDECK,
    MODELSUNKNSHIPHULL,
    MODELFLOORBASE_BAKED,
    MODELSUNKNSUB,
    MODELCORAL,
    MODELSTONE,
    MODELCORALSTONEA,
    MODELCORALSTONEB,
    MODELGLOBEBASE,
    MODELTREASURECHEST,
    MODELENVIRONMENTBOX,
    MODELSUPPORTBEAMS,
    MODELSKYBOX,
    MODELGLOBEINNER,
    MODELSEAWEEDA,
    MODELSEAWEEDB,
    MODELSMALLFISHA,
    MODELMEDIUMFISHA,
    MODELMEDIUMFISHB,
    MODELBIGFISHA,
    MODELBIGFISHB,
    MODELSMALLFISHAINSTANCEDDRAWS,
    MODELMEDIUMFISHAINSTANCEDDRAWS,
    MODELMEDIUMFISHBINSTANCEDDRAWS,
    MODELBIGFISHAINSTANCEDDRAWS,
    MODELBIGFISHBINSTANCEDDRAWS,
    MODELMAX
}

export enum MODELGROUP {
    FISH,
    FISHINSTANCEDDRAW,
    INNER,
    SEAWEED,
    GENERIC,
    OUTSIDE,
    GROUPMAX
}

export class G_sceneInfo {
    namestr: string;
    name: MODELNAME;
    program: Array<string>;
    fog: boolean;
    type: MODELGROUP;
    blend?: boolean;
}

export enum FISHENUM {
    BIG,
    MEDIUM,
    SMALL,
    MAX
}

export enum TOGGLE {
    // Stop rendering after specified time.
    AUTOSTOP,
    // Enable alpha blending.
    ENABLEALPHABLENDING,
    // Enable 4 times MSAA.
    ENABLEMSAAx4,
    // Go through instanced draw.
    ENABLEINSTANCEDDRAWS,
    // The toggle is only supported on WebGPU backend.
    // By default, the app will enable dynamic buffer offset.
    // The toggle is to disable dbo feature.
    ENABLEDYNAMICBUFFEROFFSET,
    // Turn off render pass on d3d12
    DISABLED3D12RENDERPASS,
    // Turn off WebGPU validation,
    DISABLEWEBGPUVALIDATION,
    // Disable control panel,
    DISABLECONTROLPANEL,
    // Select integrated gpu if available.
    INTEGRATEDGPU,
    // Select discrete gpu if available.
    DISCRETEGPU,
    // Update and draw for each model on OpenGL and Angle backend, but draw once per frame on other
    // backend.
    UPATEANDDRAWFOREACHMODEL,
    // Support Full Screen mode
    ENABLEFULLSCREENMODE,
    // Print logs such as avg fps
    PRINTLOG,
    // Use async buffer mapping to upload data
    BUFFERMAPPINGASYNC,
    // Simulate fish come and go for WEBGPU backend
    SIMULATINGFISHCOMEANDGO,
    // Turn off vsync, donot limit fps to 60
    TURNOFFVSYNC,
    TOGGLEMAX
}

export const g_sceneInfo: G_sceneInfo[] = [
    {
        namestr: "SmallFishA",
        name: MODELNAME.MODELSMALLFISHA,
        program: ["fishVertexShader", "fishReflectionFragmentShader"],
        fog: true,
        type: MODELGROUP.FISH
    },
    {
        namestr: "MediumFishA",
        name: MODELNAME.MODELMEDIUMFISHA,
        program: ["fishVertexShader", "fishNormalMapFragmentShader"],
        fog: true,
        type: MODELGROUP.FISH
    },
    {
        namestr: "MediumFishB",
        name: MODELNAME.MODELMEDIUMFISHB,
        program: ["fishVertexShader", "fishReflectionFragmentShader"],
        fog: true,
        type: MODELGROUP.FISH
    },
    {
        namestr: "BigFishA",
        name: MODELNAME.MODELBIGFISHA,
        program: ["fishVertexShader", "fishNormalMapFragmentShader"],
        fog: true,
        type: MODELGROUP.FISH
    },
    {
        namestr: "BigFishB",
        name: MODELNAME.MODELBIGFISHB,
        program: ["fishVertexShader", "fishNormalMapFragmentShader"],
        fog: true,
        type: MODELGROUP.FISH
    },
    {
        namestr: "SmallFishA",
        name: MODELNAME.MODELSMALLFISHAINSTANCEDDRAWS,
        program: ["fishVertexShaderInstancedDraws", "fishReflectionFragmentShader"],
        fog: true,
        type: MODELGROUP.FISHINSTANCEDDRAW
    },
    {
        namestr:  "MediumFishA",
        name: MODELNAME.MODELMEDIUMFISHAINSTANCEDDRAWS,
        program: ["fishVertexShaderInstancedDraws", "fishNormalMapFragmentShader"],
        fog: true,
        type: MODELGROUP.FISHINSTANCEDDRAW
    },
    {
        namestr: "MediumFishB",
        name: MODELNAME.MODELMEDIUMFISHBINSTANCEDDRAWS,
        program: ["fishVertexShaderInstancedDraws", "fishReflectionFragmentShader"],
        fog: true,
        type: MODELGROUP.FISHINSTANCEDDRAW
    },
    {
        namestr: "BigFishA",
        name: MODELNAME.MODELBIGFISHAINSTANCEDDRAWS,
        program: ["fishVertexShaderInstancedDraws", "fishNormalMapFragmentShader"],
        fog: true,
        type: MODELGROUP.FISHINSTANCEDDRAW
    },
    {
        namestr: "BigFishB",
        name: MODELNAME.MODELBIGFISHBINSTANCEDDRAWS,
        program: ["fishVertexShaderInstancedDraws", "fishNormalMapFragmentShader"],
        fog: true,
        type: MODELGROUP.FISHINSTANCEDDRAW
    },
    {
        namestr: "Arch",
        name: MODELNAME.MODELARCH,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "Coral",
        name: MODELNAME.MODELCORAL,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "CoralStoneA",
        name: MODELNAME.MODELCORALSTONEA,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "CoralStoneB",
        name: MODELNAME.MODELCORALSTONEB,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "EnvironmentBox",
        name: MODELNAME.MODELENVIRONMENTBOX,
        program: ["diffuseVertexShader", "diffuseFragmentShader"],
        fog: false,
        type: MODELGROUP.OUTSIDE
    },
    {
        namestr: "FloorBase_Baked",
        name: MODELNAME.MODELFLOORBASE_BAKED,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "GlobeBase",
        name: MODELNAME.MODELGLOBEBASE,
        program: ["diffuseVertexShader", "diffuseFragmentShader"],
        fog: false,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "GlobeInner",
        name: MODELNAME.MODELGLOBEINNER,
        program: ["innerRefractionMapVertexShader", "innerRefractionMapFragmentShader"],
        fog: true,
        type: MODELGROUP.INNER
    },
    {
        namestr: "RockA",
        name: MODELNAME.MODELROCKA,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "RockB", "name": MODELNAME.MODELROCKB,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "RockC",
        name: MODELNAME.MODELROCKC,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "RuinColumn",
        name: MODELNAME.MODELRUINCOlOMN,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "Stone",
        name: MODELNAME.MODELSTONE,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "SunknShipBoxes",
        name: MODELNAME.MODELSUNKNSHIPBOXES,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "SunknShipDeck",
        name: MODELNAME.MODELSUNKNSHIPDECK,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "SunknShipHull",
        name: MODELNAME.MODELSUNKNSHIPHULL,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "SunknSub",
        name: MODELNAME.MODELSUNKNSUB,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    },
    {
        namestr: "SeaweedA",
        name: MODELNAME.MODELSEAWEEDA,
        program: ["seaweedVertexShader", "seaweedFragmentShader"],
        fog: false,
        type: MODELGROUP.SEAWEED
    },
    {
        namestr: "SeaweedB",
        name: MODELNAME.MODELSEAWEEDB,
        program: ["seaweedVertexShader", "seaweedFragmentShader"],
        fog: false,
        type: MODELGROUP.SEAWEED
    },
    {
        namestr: "Skybox",
        name: MODELNAME.MODELSKYBOX,
        program: ["diffuseVertexShader", "diffuseFragmentShader"],
        fog: false,
        type: MODELGROUP.OUTSIDE
    },
    {
        namestr: "SupportBeams",
        name: MODELNAME.MODELSUPPORTBEAMS,
        program: ["", ""],
        fog: false,
        type: MODELGROUP.OUTSIDE
    },
    {
        namestr: "TreasureChest",
        name: MODELNAME.MODELTREASURECHEST,
        program: ["", ""],
        fog: true,
        type: MODELGROUP.GENERIC
    }
];

export interface Fish {
    name: string;
    modelName: MODELNAME;
    type: FISHENUM;
    speed: float;
    speedRange: float;
    radius: float;
    radiusRange: float;
    tailSpeed: float;
    heightOffset: float;
    heightRange: float;

    fishLength: float;
    fishWaveLength: float;
    fishBendAmount: float;

    lasers?: boolean;
    laserRot?: float;
    laserOff?: Array<float>;
    laserScale?: Array<float>;
}

export const fishTable: Fish[] = [
    {
        name: "SmallFishA",
        modelName: MODELNAME.MODELSMALLFISHA,
        type: FISHENUM.SMALL,
        speed: 1.0,
        speedRange: 1.5,
        radius: 30.0,
        radiusRange: 25.0,
        tailSpeed: 10.0,
        heightOffset: 0.0,
        heightRange: 16.0,
        fishLength: 10.0,
        fishWaveLength: 1.0,
        fishBendAmount: 2.0
    },
    {
        name: "MediumFishA",
        modelName: MODELNAME.MODELMEDIUMFISHA,
        type: FISHENUM.MEDIUM,
        speed: 1.0,
        speedRange: 2.0,
        radius: 10.0,
        radiusRange: 20.0,
        tailSpeed: 1.0,
        heightOffset: 0.0,
        heightRange: 16.0,
        fishLength: 10.0,
        fishWaveLength: -2.0,
        fishBendAmount: 2.0
    },
    {
        name: "MediumFishB",
        modelName: MODELNAME.MODELMEDIUMFISHB,
        type: FISHENUM.MEDIUM,
        speed: 0.5,
        speedRange: 4.0,
        radius: 10.0,
        radiusRange: 20.0,
        tailSpeed: 3.0,
        heightOffset: -8.0,
        heightRange: 5.0,
        fishLength: 10.0,
        fishWaveLength: -2.0,
        fishBendAmount: 2.0
    },
    {
        name: "BigFishA",
        modelName: MODELNAME.MODELBIGFISHA,
        type: FISHENUM.BIG,
        speed: 0.5,
        speedRange: 0.5,
        radius: 50.0,
        radiusRange: 3.0,
        tailSpeed: 1.5,
        heightOffset: 0.0,
        heightRange: 16.0,
        fishLength: 10.0,
        fishWaveLength: -1.0,
        fishBendAmount: 0.5,
        lasers: true,
        laserRot: 0.04,
        laserOff: [0.0, 0.1, 9.0],
        laserScale: [0.3, 0.3, 1000.0]
    },
    {
        name: "BigFishB",
        modelName: MODELNAME.MODELBIGFISHB,
        type: FISHENUM.BIG,
        speed: 0.5,
        speedRange: 0.5,
        radius: 45.0,
        radiusRange: 3.0,
        tailSpeed: 1.0,
        heightOffset: 0.0,
        heightRange: 16.0,
        fishLength: 10.0,
        fishWaveLength: -0.7,
        fishBendAmount: 0.3,
        lasers: true,
        laserRot: 0.04,
        laserOff: [0.0, -0.3, 9.0],
        laserScale: [0.3, 0.3, 1000.0]
    }
]

export const g_tailOffsetMult: float         = 1.0;
export const g_endOfDome: float              = Math.PI / 8.0;
export const g_tankRadius: float             = 74.0;
export const g_tankHeight: float             = 36.0;
export const g_standHeight: float            = 25.0;
export const g_sharkSpeed: float             = 0.3;
export const g_sharkClockOffset: float       = 17.0;
export const g_sharkXClock: float            = 1.0;
export const g_sharkYClock: float            = 0.17;
export const g_sharkZClock: float            = 1.0;
export const g_numBubbleSets: int            = 10;
export const g_laserEta: float               = 1.2;
export const g_laserLenFudge: float          = 1.0;
export const g_numLightRays: int             = 5;
export const g_lightRayY: int                = 50;
export const g_lightRayDurationMin: int      = 1;
export const g_lightRayDurationRange: int    = 1;
export const g_lightRaySpeed: int            = 4;
export const g_lightRaySpread: int           = 7;
export const g_lightRayPosRange: int         = 20;
export const g_lightRayRotRange: float       = 1.0;
export const g_lightRayRotLerp: float        = 0.2;
export const g_lightRayOffset: float         = Math.PI * 2.0 / g_numLightRays;
export const g_bubbleTimer: float            = 0.0;
export const g_bubbleIndex: int              = 0;

export const g_numFishSmall: int             = 100;
export const g_numFishMedium: int            = 1000;
export const g_numFishBig: int               = 10000;
export const g_numFishLeftSmall: int         = 80;
export const g_numFishLeftBig: int           = 160;
export const g_sand_shininess: float         = 5.0;
export const g_sand_specularFactor: float    = 0.3;
export const g_generic_shininess: float      = 50.0;
export const g_generic_specularFactor: float = 1.0;
export const g_outside_shininess: float      = 50.0;
export const g_outside_specularFactor: float = 0.0;
export const g_seaweed_shininess: float      = 50.0;
export const g_seaweed_specularFactor: float = 1.0;
export const g_inner_shininess: float        = 50.0;
export const g_inner_specularFactor: float   = 1.0;
export const g_fish_shininess: float         = 5.0;
export const g_fish_specularFactor: float    = 0.3;

export const g_speed: float                  = 1.0;
export const g_targetHeight: float           = 63.3;
export const g_targetRadius: float           = 91.6;
export const g_eyeHeight: float              = 7.5;
export const g_eyeSpeed: float               = 0.0258;
export const g_filedOfView: float            = 82.699;
export const g_ambientRed: float             = 0.218;
export const g_ambientGreen: float           = 0.502;
export const g_ambientBlue: float            = 0.706;
export const g_fogPower: float               = 16.5;
export const g_fogMult: float                = 1.5;
export const g_fogOffset: float              = 0.738;
export const g_fogRed: float                 = 0.338;
export const g_fogGreen: float               = 0.81;
export const g_fogBlue: float                = 1.0;
export const g_fishHeightRange: float        = 1.0;
export const g_fishHeight: float             = 25.0;
export const g_fishSpeed: float              = 0.124;
export const g_fishOffset: float             = 0.52;
export const g_fishXClock: float             = 1.0;
export const g_fishYClock: float             = 0.556;
export const g_fishZClock: float             = 1.0;
export const g_fishTailSpeed: float          = 1.0;
export const g_refractionFudge: float        = 3.0;
export const g_eta: float                    = 1.0;
export const g_tankColorFudge: float         = 0.796;
export const g_fovFudge: float               = 1.0;
export const g_net_offset: Array<float>      = [0.0, 0.0, 0.0];
export const g_net_offsetMult: float         = 1.21;
export const g_eyeRadius: float              = 13.2;
export const g_fieldOfView: float            = 82.699;

export class Global {

    public projection: Array<float>
    public view: Array<float>
    public worldInverse: Array<float>
    public viewProjectionInverse: Array<float>
    public skyView: Array<float>
    public skyViewProjection: Array<float>
    public skyViewProjectionInverse: Array<float>
    public eyePosition: Array<float>
    public target: Array<float>
    public up: Array<float>;
    public v3t0: Array<float>
    public v3t1: Array<float>
    public m4t0: Array<float>
    public m4t1: Array<float>
    public m4t2: Array<float>
    public m4t3: Array<float>
    public colorMult: Array<float>;
    public then: double;
    public start: double;
    public mclock: float;
    public eyeClock: float;
    public alpha: string;

    constructor() {
        this.projection               = BuildArray(16, () => 0.0);
        this.view                     = BuildArray(16, () => 0.0);
        this.worldInverse             = BuildArray(16, () => 0.0);
        this.viewProjectionInverse    = BuildArray(16, () => 0.0);
        this.skyView                  = BuildArray(16, () => 0.0);
        this.skyViewProjection        = BuildArray(16, () => 0.0);
        this.skyViewProjectionInverse = BuildArray(16, () => 0.0);
        this.eyePosition              = BuildArray(3, () => 0.0);
        this.target                   = BuildArray(3, () => 0.0);
        this.up                       = [0, 1, 0];
        this.v3t0                     = BuildArray(3, () => 0.0);
        this.v3t1                     = BuildArray(3, () => 0.0);
        this.m4t0                     = BuildArray(16, () => 0.0);
        this.m4t1                     = BuildArray(16, () => 0.0);
        this.m4t2                     = BuildArray(16, () => 0.0);
        this.m4t3                     = BuildArray(16, () => 0.0);
        this.colorMult                = [1, 1, 1, 1];
    }

}

export class AquariumOptions {
    canvas: HTMLCanvasElement;
    num_fish?: int;
    enable_msaa?: boolean;
    disable_dynamic_buffer_offset?: boolean;
    integrated_gpu?: boolean;
    discrete_gpu?: boolean;
    enable_full_screen_mode?: boolean;
    print_log?: boolean;
    buffer_mapping_async?: boolean;
    turn_off_vsync?: boolean;
    test_time?: int;
    disable_webgpu_validation?: boolean;
    enable_alpha_blending?: string;
    simulating_fish_come_and_go?: boolean;
    disable_control_panel?: boolean;
}

export class Aquarium {

    public toggleBitset: Array<boolean>;
    public lightWorldPositionUniform: Nullable<LightWorldPositionUniform> = new LightWorldPositionUniform();
    public worldUniforms: Nullable<WorldUniforms> = new WorldUniforms();
    public lightUniforms: Nullable<LightUniforms> = new LightUniforms();
    public fogUniforms: Nullable<FogUniforms> = new FogUniforms();
    public g: Nullable<Global> = new Global();
    public fishCount: Array<int>;

    private _modelEnumMap: Record<string, MODELNAME> = {};
    private _textureMap: Record<string, Nullable<Texture>> = {};
    private _programMap: Record<string, Nullable<Program>> = {};
    private _aquariumModels: Array<Nullable<Model>>;
    private _context: Nullable<Context> = null;
    private _fpsTimer: Nullable<FPSTimer> = null; // object to measure frames per second;
    private _curFishCount: int;
    private _preFishCount: int;
    private _testTime: int;
    private _skyUrls: Array<string>;
    private _fishBehavior: Array<Nullable<Behavior>>;

    private _fisCountGetter: () => int;
    private _fisCountSetter: (fishCount: int) => void;

    constructor() {            
        this._curFishCount = 1;
        this._preFishCount = 0;

        this.g.then          = 0.0;
        this.g.mclock        = 0.0;
        this.g.eyeClock      = 0.0;
        this.g.alpha         = "1";

        this.lightUniforms.ambient    = [g_ambientRed, g_ambientGreen, g_ambientBlue, 0.0];
        this.lightUniforms.lightColor = [1.0, 1.0, 1.0, 1.0];
        this.lightUniforms.specular   = [1.0, 1.0, 1.0, 1.0];

        this.fogUniforms.fogColor  = [g_fogRed, g_fogGreen, g_fogBlue, 1.0];
        this.fogUniforms.fogPower  = g_fogPower;
        this.fogUniforms.fogMult   = g_fogMult;
        this.fogUniforms.fogOffset = g_fogOffset;

        this.fishCount = [0, 0, 0, 0, 0];

        this.toggleBitset    = BuildArray(TOGGLE.TOGGLEMAX, () => false);
        this._aquariumModels = BuildArray(MODELNAME.MODELMAX, () => null);
        this._fpsTimer       = new FPSTimer();

        this._fisCountGetter = () => { return this.curFishCount};
        this._fisCountSetter = (fishCount: int) => { this.curFishCount = fishCount};
    }

    public dispose(): void {
        
    }

    public get skybox(): Nullable<Texture> {
        return this._textureMap["skybox"];
    }

    public get curFishCount(): int {
        return this._curFishCount;
    }

    public set curFishCount(value: int) {
        // Not fully working yet
        // this._curFishCount = value;
    }

    public get preFishCount(): int {
        return this._preFishCount;
    }

    public async init(options: AquariumOptions): Promise<boolean> {
        return Promise.resolve().then(async () => {
            // Create context
            this._context = new ContextWebGPU();

            const availableToggleBitset: Array<boolean> = this._context.availableToggleBitset;
            if (availableToggleBitset[TOGGLE.UPATEANDDRAWFOREACHMODEL]) {
                this.toggleBitset[TOGGLE.UPATEANDDRAWFOREACHMODEL] = true;
            }
            if (availableToggleBitset[TOGGLE.ENABLEDYNAMICBUFFEROFFSET]) {
                this.toggleBitset[TOGGLE.ENABLEDYNAMICBUFFEROFFSET] = true;
            }
            this.toggleBitset[TOGGLE.ENABLEALPHABLENDING] = true;

            if (!this._processOptions(options, availableToggleBitset)) {
                return false;
            }

            if (!await this._context.initialize(this.toggleBitset, options.canvas)) {
                return false;
            }

            this._calculateFishCount();

            console.log("Init resources ...");
            this._getElapsedTime();

            const resourceHelper: ResourceHelper = this._context.resourceHelper;
            const skyUrls: string[] = resourceHelper.getSkyBoxUrls();
            this._textureMap["skybox"] = await this._context.createTextureWebGPU("skybox", skyUrls);

            // Init general buffer and binding groups for WebGPU backend.
            this._context.initGeneralResources(this);
            // Avoid resource allocation in the first render loop
            this._preFishCount = this._curFishCount;

            this._setupModelEnumMap();
            await this.loadResource();
            this._context.flush();

            console.log("End loading.\nCost " + this._getElapsedTime() + "s totally.");

            this._resetFpsTime();

            return true;
        });
    }

    private _processOptions(options: AquariumOptions, availableToggleBitset: Array<boolean>): boolean {
        if (!options) {
            return false;
        }

        if (options.num_fish) {
            this._curFishCount = options.num_fish;
            if (this._curFishCount < 0) {
                console.error("Fish count should larger or equal to 0.");
                return false;
            }
        }
        if (options.enable_msaa) {
            if (!availableToggleBitset[TOGGLE.ENABLEMSAAx4]) {
                console.error("MSAA isn't implemented for the backend.");
                return false;
            }
            this.toggleBitset[TOGGLE.ENABLEMSAAx4] = true;
        }
        if (options.disable_dynamic_buffer_offset) {
            if (!availableToggleBitset[TOGGLE.ENABLEDYNAMICBUFFEROFFSET]) {
                console.error("Dynamic buffer offset is not supported.");
                return false;
            }
            this.toggleBitset[TOGGLE.ENABLEDYNAMICBUFFEROFFSET] = true;
        }
        if (options.integrated_gpu) {
            if (!availableToggleBitset[TOGGLE.INTEGRATEDGPU] &&
                !availableToggleBitset[TOGGLE.DISCRETEGPU])  {
                console.error("Dynamically choose gpu isn't supported for the backend.");
                return false;
            }

            if (availableToggleBitset[TOGGLE.DISCRETEGPU]) {
                console.error("Integrated and Discrete gpu cannot be used simultaneosly.");
            }
            this.toggleBitset[TOGGLE.INTEGRATEDGPU] = true;
        }
        if (options.discrete_gpu) {
            if (!availableToggleBitset[TOGGLE.INTEGRATEDGPU] &&
                !availableToggleBitset[TOGGLE.DISCRETEGPU])  {
                console.error("Dynamically choose gpu isn't supported for the backend.");
                return false;
            }

            if (availableToggleBitset[TOGGLE.INTEGRATEDGPU]) {
                console.error("Integrated and Discrete gpu cannot be used simultaneosly.");
            }
            this.toggleBitset[TOGGLE.DISCRETEGPU] = true;
        }
        if (options.enable_full_screen_mode) {
            if (!availableToggleBitset[TOGGLE.ENABLEFULLSCREENMODE]) {
                console.error("Full screen mode isn't supported for the backend.");
                return false;
            }
            this.toggleBitset[TOGGLE.ENABLEFULLSCREENMODE] = true;
        }
        if (options.print_log) {
            this.toggleBitset[TOGGLE.PRINTLOG] = true;
        }
        if (options.buffer_mapping_async) {
            if (!availableToggleBitset[TOGGLE.BUFFERMAPPINGASYNC]) {
                console.error("Buffer mapping async isn't supported for the backend.");
                return false;
            }
            this.toggleBitset[TOGGLE.BUFFERMAPPINGASYNC] = true;
        }
        if (options.turn_off_vsync) {
            if (!availableToggleBitset[TOGGLE.TURNOFFVSYNC]) {
                console.error("Turn off vsync isn't supported for the backend.");
                return false;
            }
            this.toggleBitset[TOGGLE.TURNOFFVSYNC] = true;
        }
        if (options.test_time) {
            this._testTime = options.test_time;
            this.toggleBitset[TOGGLE.AUTOSTOP] = true;
        }
        if (options.disable_webgpu_validation) {
            if (!availableToggleBitset[TOGGLE.DISABLEWEBGPUVALIDATION]) {
                console.error("Disable validation for WebGPU backend.");
                return false;
            }
            this.toggleBitset[TOGGLE.DISABLEWEBGPUVALIDATION] = true;
        }
        if (options.enable_alpha_blending) {
            this.g.alpha = options.enable_alpha_blending;
            if (this.g.alpha === "false") {
                this.toggleBitset[TOGGLE.ENABLEALPHABLENDING] = false;
            }
        }
        if (options.simulating_fish_come_and_go) {
            if (!availableToggleBitset[TOGGLE.SIMULATINGFISHCOMEANDGO]) {
                console.error("Simulating fish come and go is only implemented for WebGPU backend.");
                return false;
            }
            this.toggleBitset[TOGGLE.SIMULATINGFISHCOMEANDGO] = true;
        }
        if (options.disable_control_panel) {
            this.toggleBitset[TOGGLE.DISABLECONTROLPANEL] = true;
        }

        return true;
    }

    private _resetFpsTime(): void {
        this.g.start = performance.now() / 1000.0;
        this.g.then  = this.g.start
    }

    /**
     * Main render loop.
     */
    public display(): void {
        let shouldQuit: boolean = this._context.shouldQuit();
        if (!shouldQuit) {
            this._context.statsBegin()

            this._context.keyBoardQuit();
            this._render();

            this._context.doFlush(this.toggleBitset);

            if (this.toggleBitset[TOGGLE.AUTOSTOP]
                && (this.g.then - this.g.start) > this._testTime) {
                shouldQuit = true
            }

            this._context.statsEnd();
        }

        if (!shouldQuit) {
            window.requestAnimationFrame(this.display.bind(this));
        }
        else {
            this._context.terminate();

            if (this.toggleBitset[TOGGLE.PRINTLOG]) {
                this._printAvgFps();
            }
        }
    }

    private async loadResource(): Promise<void> {
        return Promise.resolve().then(async () => {
            await this._loadModels();
            await this._loadPlacement();
            if (this.toggleBitset[TOGGLE.SIMULATINGFISHCOMEANDGO]) {
                await this._loadFishScenario();
            }
        });
    }

    private _setupModelEnumMap(): void {
        for (let info of g_sceneInfo) {
            this._modelEnumMap[info.namestr] = info.name;
        }
    }

    /**
     * Load world matrices of models from json file.
     */
    private async _loadPlacement(): Promise<void> {
        const resourceHelper: ResourceHelper = this._context.resourceHelper;
        const proppath: string = resourceHelper.propPlacementPath;

        return new Promise((resolve, reject) => {
            IO.LoadJSON(proppath, (json: any, exception: string) => {
                if (exception) {
                    console.error("Unable to load placement file: " + exception);
                    reject(exception);
                }

                ASSERT("objects" in json, "JSON file does not contain an 'objects' key.");
                let objects = json.objects;
                ASSERT(Array.isArray(objects), "'objects' value is not an array.");

                for (let i: size_t = 0; i < objects.length; ++i) {
                    const name: any          = objects[i].name;
                    const worldMatrix: any[] = objects[i].worldMatrix;
                    ASSERT(Array.isArray(worldMatrix) && worldMatrix.length == 16, "Invalid world matrix");
                
                    let matrix: Array<float> = [];
                    for (let j: size_t = 0; j < worldMatrix.length; ++j) {
                        matrix.push(worldMatrix[j] as float);
                    }

                    const modelname: MODELNAME = this._modelEnumMap[name as string];
                    // MODELFIRST means the model is not found in the Map
                    if (modelname !== MODELNAME.MODELFIRST && this._aquariumModels[modelname]) {
                        this._aquariumModels[modelname].worldmatrices.push(matrix);
                    }
                }
                resolve();
            });
        });
    }

    private async _loadModels(): Promise<void> {
        return Promise.resolve().then(async () => {
            const enableInstanceddraw: boolean = this.toggleBitset[TOGGLE.ENABLEINSTANCEDDRAWS];
            for (let info of g_sceneInfo) {
                if ((enableInstanceddraw && info.type === MODELGROUP.FISH)
                    || ((!enableInstanceddraw) && info.type === MODELGROUP.FISHINSTANCEDDRAW)) {
                    continue;
                }
                await this._loadModel(info);
            }
        });
    }

    private async _loadFishScenario(): Promise<void> {
        const resourceHelper: ResourceHelper = this._context.resourceHelper;
        const fishBehaviorPath: string = resourceHelper.fishBehaviorPath;

        return new Promise((resolve, reject) => {
            IO.LoadJSON(fishBehaviorPath, (json: any, exception: string) => {
                if (exception) {
                    console.error("Unable to load fish scenario file: " + exception);
                    reject(exception);
                }

                ASSERT("behaviors" in json, "JSON file does not contain a 'behaviors' key.");
                let behaviors = json.behaviors;
                ASSERT(Array.isArray(behaviors), "'behaviors' value is not an array.");

                for (let i: size_t = 0; i < behaviors.length; ++i) {
                    const frame: int = behaviors[i].frame as int;
                    const op: string = behaviors[i].op as string;
                    const count: int = behaviors[i].count as int;

                    const behave: Behavior = new Behavior(frame, op, count);
                    this._fishBehavior.push(behave);
                }
                resolve();
            });
        });
    }

    /**
     * Load vertex and index buffers, textures and program for each model.
     * @param info the model
     */
    private async _loadModel(info: G_sceneInfo): Promise<void> {
        const resourceHelper: ResourceHelper = this._context.resourceHelper;
        const imagePath: string              = resourceHelper.imagePath;
        const programPath: string            = resourceHelper.programPath
        const modelPath: string              = resourceHelper.getModelPath(info.namestr);
    
        return new Promise(async (resolve, reject) => {
            IO.LoadJSON(modelPath, async (json: any, exception: string) => {
                if (exception) {
                    console.error("Unable to load model file: " + exception);
                    reject(exception);
                }

                ASSERT("models" in json, "JSON file does not contain a 'models' key.");
                let models = json.models;
                ASSERT(Array.isArray(models), "'models' value is not an array.");

                let model: Nullable<Model> = null;
                if (this.toggleBitset[TOGGLE.ENABLEALPHABLENDING] &&
                    info.type !== MODELGROUP.INNER && info.type !== MODELGROUP.OUTSIDE) {
                    model = this._context.createModel(this, info.type, info.name, true);
                }
                else {
                    model = this._context.createModel(this, info.type, info.name, info.blend);
                }
                this._aquariumModels[info.name] = model;

                let value = models[models.length - 1];
                {
                    // Set up textures
                    const textures: any[] = value.textures;
                    for (let textureName in textures) {
                        const name: string  = textureName as string;
                        const image: string = textures[textureName] as string;

                        if (!(image in this._textureMap)) {
                            this._textureMap[image] = await this._context.createTextureWebGPU(name, imagePath + image);
                        }

                        model.textureMap[name] = this._textureMap[image];
                    }

                    // Set up vertices
                    const arrays: any[] = value.fields;
                    for (let arrayName in arrays) {
                        const texture: any        = arrays[arrayName];
                        const name: string        = arrayName as string;
                        const numComponents: int  = texture.numComponents as int;
                        const type: string        = texture.type as string;
                        let buffer: Nullable<Buffer> = null;
                        if (name == "indices") {
                            ASSERT(type === "Uint16Array", "Invalid indices array type.");
                            let vec: Array<int> = [];
                            for (let data of texture.data) {
                                vec.push(data as int);
                            }
                            buffer = this._context.createBufferWebGPU(numComponents, new Uint16Array(vec), true);
                        }
                        else {
                            ASSERT(type === "Float32Array", "Invalid vertices array type.");
                            let vec: Array<float> = [];
                            for (let data of texture.data) {
                                vec.push(data as float);
                            }
                            buffer = this._context.createBufferWebGPU(numComponents, new Float32Array(vec), false);
                        }

                        model.bufferMap[name] = buffer;
                    }

                    // setup program
                    // There are 3 programs
                    // DM
                    // DM+NM
                    // DM+NM+RM
                    let vsId: string = info.program[0];
                    let fsId: string = info.program[1];

                    if (vsId !== "" && fsId !== "") {
                        model.textureMap["skybox"] = this._textureMap["skybox"];
                    }
                    else if ("reflection" in model.textureMap && model.textureMap["reflection"] !== null) {
                        vsId = "reflectionMapVertexShader";
                        fsId = "reflectionMapFragmentShader";

                        model.textureMap["skybox"] = this._textureMap["skybox"];
                    }
                    else if ("normalMap" in model.textureMap && model.textureMap["normalMap"] !== null) {
                        vsId = "normalMapVertexShader";
                        fsId = "normalMapFragmentShader";
                    }
                    else {
                        vsId = "diffuseVertexShader";
                        fsId = "diffuseFragmentShader";
                    }

                    let program: Nullable<Program> = null;
                    const programId: string = vsId + fsId;
                    if (programId in this._programMap) {
                        program = this._programMap[programId];
                    }
                    else {
                        program = this._context.createProgram(programPath + vsId, programPath + fsId);
                        if (this.toggleBitset[TOGGLE.ENABLEALPHABLENDING] &&
                            info.type !== MODELGROUP.INNER && info.type !== MODELGROUP.OUTSIDE) {
                            await program.compileProgram(true, this.g.alpha);
                        }
                        else {
                            await program.compileProgram(false, this.g.alpha);
                        }
                        this._programMap[programId] = program;
                    }

                    model.program = program;
                    model.init();
                }
                resolve();
            });
        });
    }

    /**
     * Calculate fish count for each type of fish
     */
    private _calculateFishCount(): void {
        let numLeft: int = this._curFishCount;
        for (let i: size_t = 0; i < FISHENUM.MAX; ++i) {
            for (let j: size_t = 0; j < fishTable.length; ++j) {
                const fishInfo: Fish = fishTable[j];
                if (fishInfo.type != i) {
                    continue;
                }
                let numfloat: int = numLeft;
                if (i == FISHENUM.BIG) {
                    let temp: int = this._curFishCount < g_numFishSmall ? 1 : 2;
                    numfloat = Math.min(numLeft, temp);
                }
                else if (i === FISHENUM.MEDIUM) {
                    if (this._curFishCount < g_numFishMedium) {
                        numfloat = Math.min(numLeft, this._curFishCount / 10);
                    }
                    else if (this._curFishCount < g_numFishBig)  {
                        numfloat = Math.min(numLeft, g_numFishLeftSmall);
                    }
                    else {
                        numfloat = Math.min(numLeft, g_numFishLeftBig);
                    }
                }
                numLeft                                                        = numLeft - numfloat;
                this.fishCount[fishInfo.modelName - MODELNAME.MODELSMALLFISHA] = numfloat;
            }
        }
    }

    private _getElapsedTime(): double {
        // Update our time
        const now: double = performance.now() / 1000.0; // now in seconds
        let elapsedTime: double = 0.0;
        if (this.g.then == 0.0) {
            elapsedTime = 0.0;
        }
        else {
            elapsedTime = now - this.g.then;
        }
        this.g.then = now;

        return elapsedTime;
    }

    private _printAvgFps(): void {
        const avg: int = this._fpsTimer.variance();

        console.log("Avg FPS: " + avg);
        if (avg == 0) {
            console.log("Invalid value. The fps is unstable.");
        }
    }

    private _updateGlobalUniforms(): void {
        let g = this.g;
        let lightWorldPositionUniform = this.lightWorldPositionUniform;

        let elapsedTime: double   = this._getElapsedTime();
        let renderingTime: double = g.then - g.start;

        this._fpsTimer.update(elapsedTime, renderingTime, this._testTime);
        g.mclock += elapsedTime * g_speed;
        g.eyeClock += elapsedTime * g_eyeSpeed;

        g.eyePosition[0] = Math.sin(g.eyeClock) * g_eyeRadius;
        g.eyePosition[1] = g_eyeHeight;
        g.eyePosition[2] = Math.cos(g.eyeClock) * g_eyeRadius;
        g.target[0]      = Math.sin(g.eyeClock + Math.PI) * g_targetRadius;
        g.target[1]      = g_targetHeight;
        g.target[2]      = Math.cos(g.eyeClock + Math.PI) * g_targetRadius;

        let nearPlane: float = 1.0;
        let farPlane: float  = 25000.0;
        let aspect: float    = (this._context.clientWidth * 1.0) / (this._context.clientHeight * 1.0);
        let top: float       = Math.tan(Matrix.degToRad(g_fieldOfView * g_fovFudge) * 0.5) * nearPlane;
        let bottom: float    = -top;
        let left: float      = aspect * bottom;
        let right: float     = aspect * top;
        let width: float     = Math.abs(right - left);
        let height: float    = Math.abs(top - bottom);
        let xOff: float      = width * g_net_offset[0] * g_net_offsetMult;
        let yOff: float      = height * g_net_offset[1] * g_net_offsetMult;

        // set frustum and camera look at
        Matrix.frustum(g.projection, left + xOff, right + xOff, bottom + yOff, top + yOff, nearPlane, farPlane);
        Matrix.cameraLookAt(lightWorldPositionUniform.viewInverse, g.eyePosition, g.target, g.up);
        Matrix.inverse4(g.view, lightWorldPositionUniform.viewInverse);
        Matrix.mulMatrixMatrix4(lightWorldPositionUniform.viewProjection, g.view, g.projection);
        Matrix.inverse4(g.viewProjectionInverse, lightWorldPositionUniform.viewProjection);

        g.skyView = g.view.slice();
        g.skyView[12] = 0.0;
        g.skyView[13] = 0.0;
        g.skyView[14] = 0.0;
        Matrix.mulMatrixMatrix4(g.skyViewProjection, g.skyView, g.projection);
        Matrix.inverse4(g.skyViewProjectionInverse, g.skyViewProjection);

        Matrix.getAxis(g.v3t0, lightWorldPositionUniform.viewInverse, 0);
        Matrix.getAxis(g.v3t1, lightWorldPositionUniform.viewInverse, 1);
        Matrix.mulScalarVector(20.0, g.v3t0, 3);
        Matrix.mulScalarVector(30.0, g.v3t1, 3);
        Matrix.addVector(lightWorldPositionUniform.lightWorldPos, g.eyePosition, g.v3t0, 3);
        Matrix.addVector(lightWorldPositionUniform.lightWorldPos,
                         lightWorldPositionUniform.lightWorldPos, g.v3t1, 3);

        // update world uniforms for WebGPU backend
        this._context.updateWorldlUniforms(this);
    }

    private _render(): void {
        Matrix.resetPseudoRandom();

        this._context.preFrame();

        // Global Uniforms should update after command reallocation.
        this._updateGlobalUniforms();

        if (this.toggleBitset[TOGGLE.SIMULATINGFISHCOMEANDGO]) {
            if (this._fishBehavior.length > 0) {
                const behave: Behavior = this._fishBehavior[0];
                let frame:int          = behave.frame;
                if (frame == 0) {
                    this._fishBehavior.shift(); // pop front element
                    if (behave.op === "+") {
                        this._curFishCount += behave.count;
                    }
                    else {
                        this._curFishCount -= behave.count;
                    }
                    console.log("Fish count " + this._curFishCount);
                }
                else {
                    behave.frame = --frame;
                }
            }
        }

        if (!this.toggleBitset[TOGGLE.ENABLEINSTANCEDDRAWS]) {
            if (this.curFishCount != this.preFishCount) {
                this._calculateFishCount();
                const enableDynamicBufferOffset: boolean = this.toggleBitset[TOGGLE.ENABLEDYNAMICBUFFEROFFSET];
                this._context.reallocResource(this.preFishCount, this.curFishCount, enableDynamicBufferOffset);
                this._preFishCount = this.curFishCount;

                this._resetFpsTime();
            }
        }

        const updateAndDrawForEachFish: Boolean = this.toggleBitset[TOGGLE.UPATEANDDRAWFOREACHMODEL];
 
        if (updateAndDrawForEachFish) {
            this._updateAndDrawBackground();
            this._updateAndDrawFishes();
            this._context.updateFPS(this._fpsTimer, this._fisCountGetter, this._fisCountSetter , this.toggleBitset);
        }
        else {
            this._updateBackground();
            this._updateFishes();
            this._context.updateFPS(this._fpsTimer, this._fisCountGetter, this._fisCountSetter, this.toggleBitset);

            // Begin render pass
            this._context.beginRenderPass();

            this._drawBackground();
            this._drawFishes();
            this._context.showFPS();

            // End renderpass
        }
    }

    private _updateAndDrawBackground(): void {
        for (let i: int = MODELNAME.MODELRUINCOlOMN; i <= MODELNAME.MODELSEAWEEDB; ++i) {
            const model: Model = this._aquariumModels[i];
            if (model) {
                this._updateWorldMatrixAndDraw(model);
            }
        }
    }

    private _drawBackground(): void {
        for (let i: int = MODELNAME.MODELRUINCOlOMN; i <= MODELNAME.MODELSEAWEEDB; ++i) {
            const model: Model = this._aquariumModels[i];
            if (model) {
                model.draw();
            }
        }
    }

    private _updateAndDrawFishes(): void {
        const begin: int = this.toggleBitset[TOGGLE.ENABLEINSTANCEDDRAWS]
                                    ? MODELNAME.MODELSMALLFISHAINSTANCEDDRAWS
                                    : MODELNAME.MODELSMALLFISHA;
        const end: int = this.toggleBitset[TOGGLE.ENABLEINSTANCEDDRAWS]
                                    ? MODELNAME.MODELBIGFISHBINSTANCEDDRAWS
                                    : MODELNAME.MODELBIGFISHB;

        for (let i: int = begin; i <= end; ++i) {
            const model: FishModel = this._aquariumModels[i] as FishModel;

            if (!model) {
                continue;
            }

            const fishInfo: Fish  = fishTable[i - begin];
            const numFish: int    = this.fishCount[i - begin];

            model.prepareForDraw();

            const fishBaseClock: float   = this.g.mclock * g_fishSpeed;
            const fishRadius: float      = fishInfo.radius;
            const fishRadiusRange: float = fishInfo.radiusRange;
            const fishSpeed: float       = fishInfo.speed;
            const fishSpeedRange: float  = fishInfo.speedRange;
            const fishTailSpeed: float   = fishInfo.tailSpeed * g_fishTailSpeed;
            const fishOffset: float      = g_fishOffset;
            // const fishClockSpeed: float  = g_fishSpeed;
            const fishHeight: float      = g_fishHeight + fishInfo.heightOffset;
            const fishHeightRange: float = g_fishHeightRange * fishInfo.heightRange;
            const fishXClock: float      = g_fishXClock;
            const fishYClock: float      = g_fishYClock;
            const fishZClock: float      = g_fishZClock;

            for (let ii: int = 0; ii < numFish; ++ii) {
                const fishClock: float      = fishBaseClock + ii * fishOffset;
                const speed: float          = fishSpeed + (Matrix.pseudoRandom() * 1.0) * fishSpeedRange;
                const scale: float          = 1.0 + Matrix.pseudoRandom() * 1.0;
                const xRadius: float        = fishRadius + (Matrix.pseudoRandom() * 1.0) * fishRadiusRange;
                const yRadius: float        = 2.0 + (Matrix.pseudoRandom() * 1.0) * fishHeightRange;
                const zRadius: float        = fishRadius + (Matrix.pseudoRandom() * 1.0) * fishRadiusRange;
                const fishSpeedClock: float = fishClock * speed;
                const xClock: float         = fishSpeedClock * fishXClock;
                const yClock: float         = fishSpeedClock * fishYClock;
                const zClock: float         = fishSpeedClock * fishZClock;

                model.updateFishPerUniforms(
                    Math.sin(xClock) * xRadius, Math.sin(yClock) * yRadius + fishHeight, Math.cos(zClock) * zRadius,
                    Math.sin(xClock - 0.04) * xRadius, Math.sin(yClock - 0.01) * yRadius + fishHeight,
                    Math.cos(zClock - 0.04) * zRadius, scale,
                    (((this.g.mclock + ii * g_tailOffsetMult) * fishTailSpeed * speed) % (Math.PI * 2.0)),
                    ii);

                model.updatePerInstanceUniforms(this.worldUniforms);
                model.draw();
            }
        }
    }

    private _updateBackground(): void {
        for (let i: int = MODELNAME.MODELRUINCOlOMN; i <= MODELNAME.MODELSEAWEEDB; ++i) {
            const model: Model = this._aquariumModels[i];
            if (model) {
                this._updateWorldMatrix(model);
            }
        }
    }

    private _updateFishes(): void {
        const begin: int = this.toggleBitset[TOGGLE.ENABLEINSTANCEDDRAWS]
                                    ? MODELNAME.MODELSMALLFISHAINSTANCEDDRAWS
                                    : MODELNAME.MODELSMALLFISHA;
        const end: int = this.toggleBitset[TOGGLE.ENABLEINSTANCEDDRAWS]
                                    ? MODELNAME.MODELBIGFISHBINSTANCEDDRAWS
                                    : MODELNAME.MODELBIGFISHB;

        for (let i: int = begin; i <= end; ++i) {
            const model: FishModel = this._aquariumModels[i] as FishModel;

            if (!model) {
                continue;
            }

            const fishInfo: Fish = fishTable[i - begin];
            const numFish: int   = this.fishCount[i - begin];

            model.prepareForDraw();

            const fishBaseClock: float   = this.g.mclock * g_fishSpeed;
            const fishRadius: float      = fishInfo.radius;
            const fishRadiusRange: float = fishInfo.radiusRange;
            const fishSpeed: float       = fishInfo.speed;
            const fishSpeedRange: float  = fishInfo.speedRange;
            const fishTailSpeed: float   = fishInfo.tailSpeed * g_fishTailSpeed;
            const fishOffset: float      = g_fishOffset;
            // const fishClockSpeed: float  = g_fishSpeed;
            const fishHeight: float      = g_fishHeight + fishInfo.heightOffset;
            const fishHeightRange: float = g_fishHeightRange * fishInfo.heightRange;
            const fishXClock: float      = g_fishXClock;
            const fishYClock: float      = g_fishYClock;
            const fishZClock: float      = g_fishZClock;

            for (let ii: int = 0; ii < numFish; ++ii) {
                const fishClock: float      = fishBaseClock + ii * fishOffset;
                const speed: float          = fishSpeed + (Matrix.pseudoRandom() * 1.0) * fishSpeedRange;
                const scale: float          = 1.0 + Matrix.pseudoRandom() * 1.0;
                const xRadius: float        = fishRadius + (Matrix.pseudoRandom() * 1.0) * fishRadiusRange;
                const yRadius: float        = 2.0 + (Matrix.pseudoRandom() * 1.0) * fishHeightRange;
                const zRadius: float        = fishRadius + (Matrix.pseudoRandom() * 1.0) * fishRadiusRange;
                const fishSpeedClock: float = fishClock * speed;
                const xClock: float         = fishSpeedClock * fishXClock;
                const yClock: float         = fishSpeedClock * fishYClock;
                const zClock: float         = fishSpeedClock * fishZClock;

                model.updateFishPerUniforms(
                    Math.sin(xClock) * xRadius, Math.sin(yClock) * yRadius + fishHeight, Math.cos(zClock) * zRadius,
                    Math.sin(xClock - 0.04) * xRadius, Math.sin(yClock - 0.01) * yRadius + fishHeight,
                    Math.cos(zClock - 0.04) * zRadius, scale,
                    (((this.g.mclock + ii * g_tailOffsetMult) * fishTailSpeed * speed) % (Math.PI * 2.0)),
                    ii);
            }
        }

        this._context.updateAllFishData();
    }

    private _drawFishes(): void {
        const begin = this.toggleBitset[TOGGLE.ENABLEINSTANCEDDRAWS]
                                ? MODELNAME.MODELSMALLFISHAINSTANCEDDRAWS
                                : MODELNAME.MODELSMALLFISHA;
        const end = this.toggleBitset[TOGGLE.ENABLEINSTANCEDDRAWS]
                                ? MODELNAME.MODELBIGFISHBINSTANCEDDRAWS
                                : MODELNAME.MODELBIGFISHB;

        for (let i: int = begin; i <= end; ++i) {
            const model: FishModel = this._aquariumModels[i] as FishModel;
            if (model) {
                model.draw();
            }            
        }
    }

    private _updateWorldProjections(w: FloatArray) {
        ASSERT(w.length === 16, "The length of the array should be equal to 16.");
        for (let i: uint32_t = 0; i < 16; ++i) {
            this.worldUniforms.world[i] = w[i];
        }
        Matrix.mulMatrixMatrix4(this.worldUniforms.worldViewProjection, this.worldUniforms.world,
                                this.lightWorldPositionUniform.viewProjection);
        Matrix.inverse4(this.g.worldInverse, this.worldUniforms.world);
        Matrix.transpose4(this.worldUniforms.worldInverseTranspose, this.g.worldInverse);
    }

    private _updateWorldMatrixAndDraw(model: Nullable<Model>): void {
        if (model.worldmatrices.length > 0) {
            for (let world of model.worldmatrices) {
                this._updateWorldProjections(world);
                model.prepareForDraw();
                model.updatePerInstanceUniforms(this.worldUniforms);
                model.draw();
            }
        }
    }

    private _updateWorldMatrix(model: Nullable<Model>): void {
        if (model.worldmatrices.length > 0) {
            for (let world of model.worldmatrices) {
                this._updateWorldProjections(world);
                model.updatePerInstanceUniforms(this.worldUniforms);
            }
        }

        model.prepareForDraw();
    }

}