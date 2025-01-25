# Using XHR in Service Workers

This sample demonstrates how to use code that relies on XHR within a extension's background service worker.

## Overview

The default background environment for extensions is the service worker. As a result, it only has direct access to [Fetch](https://developer.mozilla.org/docs/Web/API/Fetch_API/Using_Fetch). If you want to use a library that is built with XHR, this will not work by default. However, you can usually monkeypatch the expected behavior by polyfilling XHR. This sample shows an example of how you can use build tools to automatically inject a polyfill for XHR that covers most common XHR use cases, allowing for seamless integration into your extension.

In this sample, we are using a "library" that exports a function called [`fetchTitle`](./third_party/fetchTitle.js). For the fiction of this sample, this is a dependency we _must_ use, but we are unable to change ourselves. Unfortunately, it uses XHR. In order to make this work, we [import](./background.js#L1) a [shim](./third_party/xhr-shim/xhr-shim.js), and then [set the global `XMLHttpRequest` to it](./background.js#L4).

This is all packaged by a build system, in this case [Rollup](https://rollupjs.org/).

## Running this extension

1. Clone this repository
2. Run `npm install` in this folder to install all dependencies.
3. Run `npm run build` to bundle the extension.
