# WebGPU Aquarium

The WebGPU API is the successor to the WebGL and WebGL 2 graphics APIs for the Web. It aims to provide modern features such as “GPU compute” as well as lower overhead access to GPU hardware and better, more predictable performance. WebGPU is being developed by the [“GPU for the Web”](https://www.w3.org/community/gpu/) W3C community group.


WebGPU Aquarium is an reimplementation of [WebGL Aquarium](https://github.com/WebGLSamples/WebGLSamples.github.io) using the WebGPU API and based on the [Dawn](https://dawn.googlesource.com/dawn) backend of the native implementation [Aquarium](https://github.com/webatintel/aquarium). The goal of this project is to compare the performance of WebGPU (JavaScript) version to its native counterparts, such as OpenGL, D3D, Vulkan, Metal, ANGLE and Dawn.

Note: this project is currenlty work in progress, a list with todos is available in this readme file.

[Online Demo](http://samdauwe.github.io/webgpu-aquarium/dist)

[![Build Status](https://travis-ci.org/samdauwe/webgpu-aquarium.svg?branch=master)](https://travis-ci.org/samdauwe/webgpu-aquarium)

## Setup

First install:

- [Git](https://git-scm.com/)

- [Node.js](https://nodejs.org/en/)

- A Text Editor such as [Visual Studio Code](https://code.visualstudio.com/).

Then type the following commands in any terminal such as [VS Code's Integrated Terminal](https://code.visualstudio.com/docs/editor/integrated-terminal).

```bash
# Clone the repo
git clone https://github.com/samdauwe/webgpu-aquarium

# Go inside the 'webgpu-aquarium' folder
cd webgpu-aquarium

# Start installing dependencies, building, and running at localhost:8080
npm start
```

Launch [Chrome Canary](https://www.google.com/chrome/canary/) with the `enable-unsafe-webgpu` flag set and open the aquarium scene using the url 'http://localhost:8080/dist'. Other browsers were not tested yet, see the [Implementation Status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status) page for updates on browser support.

## Local development

Hot code reloading does not seem to be always very reliable, this might be a caching issue. An alternative approach is to launch a local http server:

```bash
# Go inside the 'webgpu-aquarium' folder
cd webgpu-aquarium

# Start a local http server listening on port 8080
python3 -m http.server 8080
```

Manually trigger a rebuild in a separate console on code changes:

```bash
# Go inside the 'webgpu-aquarium' source folder
cd webgpu-aquarium
cd src

# Start a local http server listening on port 8080
npm run build
```

Refresh the aquarium scene on the url 'http://localhost:8080/dist'.

## Todo

* [ ] Inner globe is not properly rendered and is therefore currently disabled.
* [ ] Debug asynchronous buffer mapping for better performance.
* [ ] Add control panel (i.e. to configure the amount of fish and showing the fps).
* [ ] Seaweeds are not rendered transparent and are flickering.
* [ ] Scene does not exacly match the native counterpart (i.e. placement of meshes).
* [ ] Implement scene resize.

## License

Open-source under [BSD 3-Clause License](https://opensource.org/licenses/BSD-3-Clause).
