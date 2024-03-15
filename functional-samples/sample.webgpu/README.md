# WebGPU extension sample

This sample demonstrates how to use the [WebGPU API](https://webgpu.dev/) to generate a red triangle using an extension service worker.

> [!WARNING]  
> Service worker support in WebGPU is enabled by default in Chrome 124.
> If you are using Chrome 123, you can still enable this feature by running Chrome with the "Experimental Web Platform Features" flag.

## Overview

In this sample, clicking the action button opens a red triangle image in a new tab.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension from the extension menu.
4. Click the extension's action icon to open the red triangle in a new tab.
