<a target="_blank" href="https://chrome.google.com/webstore/detail/pjfconokbhkicolnaaphhfhjpcgnnfpj">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Hello 3D World

A basic application using WebGL capabilities. It loads a 3D model from a JSON file and allows for model rotation and camera zooming, based on mouse movements. Dragging the mouse enters pointer lock, allowing movement unlimited by window or screen boundaries.

This sample uses the frameless window:

    chrome.app.runtime.onLaunched.addListener(function() {
      chrome.app.window.create('index.html',
        {frame: 'none', innerBounds: {width: 500, height: 400}});
    });

## APIs

* [Window](https://developer.chrome.com/docs/extensions/reference/app_window)
* [Runtime](https://developer.chrome.com/docs/extensions/reference/app_runtime)
* [Pointer Lock](http://www.w3.org/TR/pointerlock/)

## External libs

* [Three.js](https://github.com/mrdoob/three.js/)
