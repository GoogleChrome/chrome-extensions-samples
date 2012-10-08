# Hello 3D World

This is the most basic application that one can create, using WebGL capabilities. It loads a (cool) 3D model from a JSON file and allows for model rotation and camera zooming, based on mouse movements.

This sample uses the frameless window:

    chrome.app.runtime.onLaunched.addListener(function() {
      chrome.app.window.create('index.html',
        {frame: 'none', width: 500, height: 400});
    });

## APIs

* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)

## External libs

* [Three.js](https://github.com/mrdoob/three.js/)
