# Using XHR in Service Workers

This sample demonstrates how to use code that relies on XHR within a extension's background service worker.

## Overview

The default background environment for extensions is the service worker. As a result, it only has direct access to [Fetch](https://developer.mozilla.org/docs/Web/API/Fetch_API/Using_Fetch). If you want to use a library that is built with XHR, this will not work by default. However, you can usually monkeypatch the expected behavior by polyfilling XHR. This sample shows an example of how you can use build tools to automatically inject a polyfill for XHR that covers most common XHR use cases, allowing for seamless integration into your extension.

## Running this extension

1. Clone this repository
2. Run `npm install` in this folder to install all dependencies.
3. Run `npm run build` to bundle the extension.
