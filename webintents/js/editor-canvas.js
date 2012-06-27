/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Kinuko Yasuda (kinuko@chromium.org)
*/
var editor = editor || {};

// Canvas object for drawing area.
editor.Canvas = function(id) {
  this.imageSaveType = 'image/png';
  this.onedit = function(){};
  this.onundo = function(){};

  var canvas = document.getElementById(id);
  var ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgb(0, 0, 0)';
  ctx.lineWidth = 6;

  var prev = document.createElement('canvas');
  prev.width = canvas.width;
  prev.height = canvas.height;
  prevContext = prev.getContext('2d');
  prevContext.fillStyle = '#fff';
  prevContext.fillRect(0, 0, prev.width, prev.height);

  // Public accessors.
  this.getCanvas = function() { return canvas; };
  this.getContext = function() { return ctx; };
  this.getStrokeColor = function() { return ctx.strokeStyle; };
  this.setStrokeColor = function(color) { ctx.strokeStyle = color; };
  this.getLineWidth = function() { return ctx.lineWidth; };
  this.setLineWidth = function(width) { ctx.lineWidth = width; };

  // Undo routines (history=1).
  this.saveUndoImage = function() {
    prevContext.drawImage(canvas, 0, 0);
  }
  this.undo = function() {
    ctx.drawImage(prev, 0, 0);
    this.onundo();
  };

  // Mouse event handlers.
  var mousedown = false;
  canvas.onmousedown = function(e) {
    if (mousedown)
      return;
    mousedown = true;
    var current = editor.getMousePosition(e);
    this.saveUndoImage();
    ctx.beginPath();
  }.bind(this);

  canvas.onmouseup = function(e) {
    mousedown = false;
    ctx.closePath();
    this.onedit();
  }.bind(this);

  canvas.onmousemove = function(e) {
    if (mousedown) {
      var current = editor.getMousePosition(e);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
    }
  }.bind(this);

  // Clear everything before we begin.
  this.clear();
};

editor.Canvas.prototype.clear = function() {
  this.saveUndoImage();
  var ctx = this.getContext();
  var canvas = this.getCanvas();
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  this.onedit();
}

editor.Canvas.prototype.toBlob = function(callback) {
  var canvas = this.getCanvas();
  if (canvas.toBlob) {
    canvas.toBlob(callback, this.imageSaveType);
    return;
  }
  var dataURI = canvas.toDataURL(this.imageSaveType);
  callback(editor.dataURIToBlob(dataURI));
};

editor.Canvas.prototype.fromURL = function(url, callback) {
  var ctx = this.getContext();
  var image = new Image();
  image.src = url;
  image.onload = function() {
    this.clear();
    ctx.save();
    var canvas = this.getCanvas();
    var scale = 1.0;
    if (image.width > canvas.width)
      scale = canvas.width / image.width;
    if (image.height > canvas.height) {
      var hscale = canvas.height / image.height;
      scale = hscale > scale ? scale : hscale;
    }
    var x = (canvas.width - image.width * scale) / 2;
    var y = (canvas.height - image.height * scale) / 2;
    ctx.scale(scale, scale);
    ctx.drawImage(image, x / scale, y / scale);
    ctx.restore();
    if (callback) callback();
  }.bind(this);
};

// ColorPicker object.
editor.ColorPicker = function(id, options) {
  var defaults = {
    onpick: function(c) { console.log(c); },
    colorElems: ['0', '9', 'f'],
    colorsPerLine: 9
  };

  var onpick = (options && options.onpick) || defaults.onpick;
  var colorElems = (options && options.colorElems) || defaults.colorElems;
  var colorsPerLine = (options && options.colorsPerLine) || defaults.colorsPerLine;

  var colors = [];
  for (var r = 0; r < colorElems.length; ++r) {
    for (var g = 0; g < colorElems.length; ++g) {
      for (var b = 0; b < colorElems.length; ++b) {
        colors.push(colorElems[r] + colorElems[g] + colorElems[b]);
      }
    }
  }

  var picker = document.getElementById(id);

  for (var i = 0; i < colors.length; ++i) {
    var item = document.createElement('div');
    item.classList.add('picker_item');
    item.style.background = '#' + colors[i];
    item.addEventListener('click', onpick.bind(this, '#' + colors[i]));
    picker.appendChild(item);
    if ((i + 1) % colorsPerLine == 0) {
      var breaker = document.createElement('div');
      breaker.classList.add('picker_break');
      picker.appendChild(breaker);
    }
  }
  var end = document.createElement('div');
  end.classList.add('picker_break');
  picker.appendChild(end);
};

// BrushPicker object.
editor.BrushPicker = function(id, options) {
  var defaults = {
    onpick: function(c) { console.log(c); },
    brushes: [3, 6, 9, 12]
  };
  var onpick = (options && options.onpick) || defaults.onpick;
  var brushes = (options && options.brushes) || defaults.brushes;

  var drawPencil = function(canvas, width) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.arc(canvas.width / 2, canvas.height / 2, width / 2,
            0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();
  };

  var picker = document.getElementById(id);
  for (var i = 0; i < brushes.length; ++i) {
    var item = document.createElement('canvas');
    item.classList.add('picker_item');
    item.classList.add('tool_button');
    item.width = 35;
    item.height = 20;
    item.addEventListener('click', onpick.bind(this, brushes[i]));
    drawPencil(item, brushes[i]);
    picker.appendChild(item);
  }
};

// Pencil object; this is just for showing the current pencil settings.
editor.Pencil = function(id, drawCanvas) {
  this.canvas = document.getElementById(id);
  this.drawCanvas = drawCanvas;
  this.ctx = this.canvas.getContext('2d');
  this.drawPencil();
};

editor.Pencil.prototype.drawPencil = function() {
  this.ctx.save();
  this.ctx.fillStyle = '#fff';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.beginPath();
  this.ctx.fillStyle = this.drawCanvas.getStrokeColor();
  this.ctx.arc(this.canvas.width / 2,
               this.canvas.height / 2,
               this.drawCanvas.getLineWidth() / 2,
               0, Math.PI*2, false);
  this.ctx.fill();
  this.ctx.closePath();
  this.ctx.restore();
};

editor.Pencil.prototype.setStrokeColor = function(c) {
  this.drawCanvas.setStrokeColor(c);
  this.drawPencil();
};

editor.Pencil.prototype.setLineWidth = function(w) {
  this.drawCanvas.setLineWidth(w);
  this.drawPencil();
};

