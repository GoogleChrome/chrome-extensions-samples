// These snippets contain code that was valid at the time of the June 2012 Google I/O
// presentation during which we used this code editor. The APIs have evolved since then,
// but we are not necessarily keeping these snippets up to date. Please don't expect
// that they'll work.
var SNIPPETS = {
  "Hello World: Manifest": '{\n  "manifest_version": 2,\n  "name": "Hello World",\n  "version": "0.0.1",\n  "app": {\n    "background": {\n      "scripts": ["main.js"]\n    }\n  },\n}\n',
  "Hello World: main.js": "chrome.app.runtime.onLaunched.addListener(function() {\n  chrome.app.window.create('window.html', {\n    bounds: { \n      width: 400,\n      height: 400\n    }});\n})",
  "Hello World: window.html": '<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello World!</h1>\n  </body>\n</html>',
  "Hello World: window.html w/form": '<!DOCTYPE html>\n<html>\n  <script src="window.js"></script>\n  </head>\n  <body>  \n\n    <form id="name-form">\n      <input id="name-input" size="40">\n      <input type="submit">\n    </form>\n  \n    <h2>Hello <span id="output"></span></h2> \n  </body>\n</html>',
  "Hello World: window.js": "onload = function() {\n  document.getElementById('name-form').onsubmit = function(e) {\n    e.preventDefault();\n\n    document.getElementById('output').innerHTML =\n        document.getElementById('name-input').value;\n  };\n};\n",
  "Servo: onRead": "function onRead(readInfo) {\n  var uint8View = new Uint8Array(readInfo.data);\n  var value = uint8View[0] - '0'.charCodeAt(0);\n  var rotation = value * 18.0;\n\n  document.getElementById('image').style.webkitTransform =\n    'rotateZ(' + rotation + 'deg)';\n\n  // Keep on reading.\n  chrome.serial.read(connectionId, onRead);\n};"
};
