# Hello 3D World

A basic application using WebGL capabilities. It loads a 3D model from a JSON file and allows for model rotation and camera zooming, based on mouse movements. Dragging the mouse enters pointer lock, allowing movement unlimited by window or screen boundaries.

This sample uses the frameless window:

    chrome.app.runtime.onLaunched.addListener(function() {
      chrome.app.window.create('index.html',
        {frame: 'none', bounds: {width: 500, height: 400}});
    });

## APIs

* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Pointer Lock](http://www.w3.org/TR/pointerlock/)

## External libs

* [Three.js](https://github.com/mrdoob/three.js/)
