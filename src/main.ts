import { Aquarium, AquariumOptions } from "./aquarium";

async function runWebGPUAquarium() {
    const canvas = document.getElementById('gfx') as HTMLCanvasElement;
    const aquarium: Aquarium = new Aquarium();
    const options: AquariumOptions = {
        canvas: canvas,
        enable_full_screen_mode: true,
        num_fish: 100,
        enable_msaa: true,
        buffer_mapping_async: false,
        disable_control_panel: false,
    }
    aquarium.init(options)
        .then((success: boolean) => {
            if (success) {
                aquarium.display();
            }
            else {
                console.error('Unable to initialize aquarium!');
            }
        }) 
        .catch((error) => {
            console.error(error); 
        });
}

runWebGPUAquarium();