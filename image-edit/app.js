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

Author: Eric Bidelman (ericbidelman@chromium.org)
*/

var canvas = document.querySelector('canvas');
var canvasContext = canvas.getContext('2d');
var chooseFileButton = document.querySelector('#choose_file');
var chosenFileEntry = null;
var cropButton = document.querySelector('#crop');
var cropCanvas = document.createElement('canvas');
var cropCanvasContext = cropCanvas.getContext('2d');
var cropSquare = undefined;
var cropSquareHandlesSize = 20;
var cropStyle = "rgba(0, 0, 0, 0.5)";
var displayOffset = undefined;
var displayScale = undefined;
var filePath = document.querySelector('#file_path');
var image_display = document.querySelector('#image_display');
var img = new Image();
var mouseLastScreenCoords = undefined;
var output = document.querySelector('output');
var saveFileButton = document.querySelector('#save_file');

function clearState() {
  img.src = "";
  drawCanvas(); // clear it.
  resetCrop();
  filePath.value = "";
}

function errorHandler(e) {
  console.error(e);
}

function displayPath(fileEntry) {
  chrome.fileSystem.getDisplayPath(fileEntry, function(path) {
    filePath.value = path;
  });
}

function resetCrop() {
  cropSquare = {
    x: img.width * 0.5,
    y: img.height * 0.1,
    w: img.width * 0.8,
    h: img.height * 0.8
  };
}

function canvasMouseDown (e) {
  mouseLastScreenCoords = { x: e.screenX, y: e.screenY };
}

function stopTrackingMouseDrag () {
  mouseLastScreenCoords = undefined;
}

function canvasMouseMove(e) {
  if (mouseLastScreenCoords) {
    moveCrop(
      e.screenX,
      e.screenY,
      e.screenX - mouseLastScreenCoords.x,
      e.screenY - mouseLastScreenCoords.y);
    mouseLastScreenCoords = { x: e.screenX, y: e.screenY };
  }
}

function moveCrop(x, y, dx, dy) {
  if (!displayScale || !displayOffset || !cropSquare)
    return;

  var handlesRect = cropSquareHandles();

  cropSquare.x += dx / displayScale;
  cropSquare.y += dy / displayScale;

  webkitRequestAnimationFrame(drawCanvas);
}

function updateScaleAndOffset() {
  // scale such that image fits on canvas.
  displayScale = Math.min(
    canvas.width / img.width,
    canvas.height / img.height);

  // offset such that image is centered.
  displayOffset = {
    x: Math.max(0, canvas.width / displayScale - img.width) / 2,
    y: Math.max(0, canvas.height / displayScale - img.height) / 2
  };
}

function offsetThenScaleRect(rect, scale, offset) {
  return {
    x: scale * (offset.x + rect.x),
    y: scale * (offset.y + rect.y),
    w: scale * rect.w,
    h: scale * rect.h
  };
}

function cropSquareHandles() {
  return {
      x: cropSquare.x - cropSquareHandlesSize,
      y: cropSquare.y - cropSquareHandlesSize,
      w: cropSquare.w + 2 * cropSquareHandlesSize,
      h: cropSquare.h + 2 * cropSquareHandlesSize
  };
}

function drawCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  var cc = canvasContext;

  if (!img.width || !img.height || !canvas.width || !canvas.height)
    return;  // No img, so just leave canvas cleared.

  // Work in the coordinate space of the image.
  // Scale and translate for optimal display on the canvas.
  updateScaleAndOffset();
  var s = displayScale;
  var o = displayOffset;
  var imgRect = { x: 0, y: 0, w: img.width, h: img.height };
  var imgRectXformed = offsetThenScaleRect(imgRect, s, o);
  var cropSquareXformed = offsetThenScaleRect(cropSquare, s, o);
  var cropSquareXformedInverted = {
    x: cropSquareXformed.x,
    y: cropSquareXformed.y + cropSquareXformed.h,
    w: cropSquareXformed.w,
    h: -cropSquareXformed.h
  };
  var cropSquareHandlesXformed = offsetThenScaleRect(cropSquareHandles(), s, o);

  cc.drawImage(img, imgRectXformed.x, imgRectXformed.y, imgRectXformed.w, imgRectXformed.h);

  {  // Draw crop window.
    cc.save();
    cc.fillStyle = cropStyle;

    cc.beginPath();
    // Fill whole canvas with a rect
    cc.rect(0, 0, canvas.width, canvas.height);
    // Cut out the crop area with an inverted rect.
    cc.rect(cropSquareXformedInverted.x, cropSquareXformedInverted.y, cropSquareXformedInverted.w, cropSquareXformedInverted.h);
    cc.fill();

    cc.beginPath();
    // Fill just handles area with a rect
    cc.rect(cropSquareHandlesXformed.x, cropSquareHandlesXformed.y, cropSquareHandlesXformed.w, cropSquareHandlesXformed.h);
    // Cut out the crop area with an inverted rect.
    cc.rect(cropSquareXformedInverted.x, cropSquareXformedInverted.y, cropSquareXformedInverted.w, cropSquareXformedInverted.h);
    cc.fill();

    cc.restore();
  }
}

window.onresize = function () {
  drawCanvas();
}

function loadImageFromFile(file) {
  loadImageFromURL(URL.createObjectURL(file));
}

function loadImageFromURL(url) {
  clearState();
  img.onload = imageHasLoaded;
  img.src = url;
}

function imageHasLoaded() {
    resetCrop();
    drawCanvas();
    cropButton.disabled = false;
    saveFileButton.disabled = false;
}

function writeFileEntry(writableEntry, opt_blob, callback) {
  if (!writableEntry) {
    output.textContent = 'Nothing selected.';
    return;
  }

  writableEntry.createWriter(function(writer) {

    writer.onerror = errorHandler;
    writer.onwriteend = callback;

    // If we have data, write it to the file. Otherwise, just use the file we
    // loaded.
    if (opt_blob) {
      writer.truncate(opt_blob.size);
      waitForIO(writer, function() {
        writer.seek(0);
        writer.write(opt_blob);
      });
    } else {
      chosenFileEntry.file(function(file) {
        writer.truncate(file.fileSize);
        waitForIO(writer, function() {
          writer.seek(0);
          writer.write(file);
        });
      });
    }
  }, errorHandler);
}

function waitForIO(writer, callback) {
  // set a watchdog to avoid eventual locking:
  var start = Date.now();
  // wait for a few seconds
  var reentrant = function() {
    if (writer.readyState===writer.WRITING && Date.now()-start<4000) {
      setTimeout(reentrant, 100);
      return;
    }
    if (writer.readyState===writer.WRITING) {
      console.error("Write operation taking too long, aborting!"+
        " (current writer readyState is "+writer.readyState+")");
      writer.abort();
    } else {
      callback();
    }
  };
  setTimeout(reentrant, 100);
}

function loadFileEntry(_chosenFileEntry) {
  chosenFileEntry = _chosenFileEntry;
  chosenFileEntry.file(function(file) {
    loadImageFromFile(file);
    displayPath(chosenFileEntry);
  });
}

function loadInitialFile(launchData) {
  if (launchData && launchData.items && launchData.items[0]) {
    loadFileEntry(launchData.items[0].entry);
  } else {
    chrome.storage.local.get('chosenFile', function(items) {
      if (items.chosenFile) {
        chrome.fileSystem.restoreEntry(items.chosenFile, function(chosenEntry) {
          if (chosenEntry) {
            loadFileEntry(chosenEntry);
          }
        });
      }
    });
  }
}

// Returns intersecting rect { x, y, w, h } of two inputs.
function intersectRects(a, b) {
  var out = {
    x: Math.max(a.x, b.x),
    y: Math.max(a.y, b.y),
    w: 0,
    h: 0
  };
  out.w = Math.min(a.x + a.w, b.x + b.w) - out.x;
  out.h = Math.min(a.y + a.h, b.y + b.h) - out.y;
  out.w = Math.max(out.w, 0);
  out.w = Math.max(out.w, 0);
  return out;
}

// Rounds a rect { x, y, w, h } to integers.
function copyAsIntegerRect(sourceRect) {
  var out = {
    x: Math.round(sourceRect.x),
    y: Math.round(sourceRect.y),
    w: Math.round(sourceRect.w),
    h: Math.round(sourceRect.h)
  };
  return out;
}

function crop () {
  if (!cropCanvas ||
      !cropSquare.w || !cropSquare.h ||
      !img.width || !img.height)
    return;
  var clippedRect = intersectRects(
    {x: 0, y: 0, w: img.width, h: img.height },
    cropSquare);
  var intRect = copyAsIntegerRect(clippedRect);
  cropCanvas.width = intRect.w;
  cropCanvas.height = intRect.h;
  cropCanvasContext.drawImage(img, -intRect.x, -intRect.y);
  loadImageFromURL(cropCanvas.toDataURL());
}

function chooseFile () {
  var accepts = [{
    mimeTypes: ['image/*'],
    extensions: ['jpeg', 'png']
  }];
  chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(readOnlyEntry) {
    if (!readOnlyEntry) {
      output.textContent = 'No file selected.';
      return;
    }
    try { // TODO remove try once retain is in stable.
    chrome.storage.local.set(
        {'chosenFile': chrome.fileSystem.retainEntry(readOnlyEntry)});
    } catch (e) {}
    loadFileEntry(readOnlyEntry);
  });
}

function dataURItoBlob(dataURI) {
  // adapted from:
  // http://stackoverflow.com/questions/6431281/save-png-canvas-image-to-html5-storage-javascript

  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], { "type": mimeString });
  return blob;
};

function saveFile() {
  if (!cropCanvas || !img.width || !img.height)
    return;
  cropCanvas.width = img.width;
  cropCanvas.height = img.height;
  cropCanvasContext.drawImage(img, 0, 0);
  var blob = dataURItoBlob(cropCanvas.toDataURL());

  var config = {type: 'saveFile', suggestedName: chosenFileEntry.name};
  chrome.fileSystem.chooseEntry(config, function(writableEntry) {
    writeFileEntry(writableEntry, blob, function(e) {
      output.textContent = 'Write complete :)';
    });
  });
}

// Support dropping a single file onto this app.
function draggedDataDropped(data) {
  items = data.items;
  chosenFileEntry = null;
  for (var i = 0; i < data.items.length; i++) {
    var item = data.items[i];
    if (item.kind == 'file' &&
        item.type.match('image/*') &&
        item.webkitGetAsEntry()) {
      chosenFileEntry = item.webkitGetAsEntry();
      break;
    }
  };

  if (!chosenFileEntry) {
    output.textContent = "Sorry. That's not a text file.";
    return;
  } else {
        output.textContent = "";
  }

  loadFileEntry(chosenFileEntry);
}


chooseFileButton.addEventListener('click', chooseFile);
window.addEventListener('mousedown', canvasMouseDown);
window.addEventListener('mouseup', stopTrackingMouseDrag);
window.addEventListener('blur', stopTrackingMouseDrag);
window.addEventListener('mousemove', canvasMouseMove);
cropButton.addEventListener('click', crop);
saveFileButton.addEventListener('click', saveFile);
new DnDFileController('body', draggedDataDropped);

loadInitialFile(launchData);
