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
var cropSquareHandlesSize = 50;
var displayOffset = undefined;
var displayScale = undefined;
var image_display = document.querySelector('#image_display');
var img = new Image();
var mouseMovingCropParameter = undefined;
var mouseLastCoords = undefined;
var output = document.querySelector('output');
var saveFileButton = document.querySelector('#save_file');

function clearState() {
  img.src = "";
  drawCanvas(); // clear it.
  resetCrop();
}

function errorHandler(e) {
  console.error(e);
}

function displayText(text) {
    output.textContent = text;
}

function displayfileEntryPath(fileEntry) {
  chrome.fileSystem.getDisplayPath(fileEntry, displayText);
}

function resetCrop() {
  cropSquare = {
    x: 0,
    y: 0,
    w: img.width,
    h: img.height
  };
}

function getHandleHoverData(clientX, clientY) {
  if (!img.width || !img.height)
    return undefined;

  var canvasRect = canvas.getBoundingClientRect();
  var x = clientX - canvasRect.left;
  var y = clientY - canvasRect.top;

  var inner = getRectInCanvasCoords(cropSquare);
  var outer = getCropSquareHandlesInCanvasCoords();
  addRightAndBottomToRect(inner);
  addRightAndBottomToRect(outer);

  var movingParams = {
    x: x >= outer.x && x <= inner.x && y >= outer.y && y <= outer.b,
    w: x >= inner.r && x <= outer.r && y >= outer.y && y <= outer.b,
    y: y >= outer.y && y <= inner.y && x >= outer.x && x <= outer.r,
    h: y >= inner.b && y <= outer.b && x >= outer.x && x <= outer.r
  };
  return movingParams;
}

function mouseDown (e) {
  mouseLastCoords = { x: e.clientX, y: e.clientY };
  mouseMovingCropParameter = getHandleHoverData(e.clientX, e.clientY);
}

function stopTrackingMouseDrag () {
  mouseLastCoords = undefined;
  mouseMovingCropParameter = undefined;
}

function mouseMove(e) {
  if (mouseLastCoords) {
    moveCrop(e.clientX - mouseLastCoords.x,
             e.clientY - mouseLastCoords.y);
    mouseLastCoords = { x: e.clientX, y: e.clientY };
  } else {
    // Set mouse cursor.
    var x = false;
    var y = false;
    var movingParams = getHandleHoverData(e.clientX, e.clientY);
    var moveParamsString =
        movingParams === undefined ? "undefined" :
        (movingParams.y ? "n" : "") +
        (movingParams.h ? "s" : "") +
        (movingParams.x ? "w" : "") +
        (movingParams.w ? "e" : "");
    switch (moveParamsString) {
      case "n":
      case "nw":
      case "ne":
      case "s":
      case "sw":
      case "se":
      case "w":
      case "e":
        moveParamsString += "-resize";
        break;
      case "undefined":
        moveParamsString = "auto";
        break;
      default:
        moveParamsString = "move";
    };
    canvas.style.cursor = moveParamsString;
  }
}

// x, y, in canvas coordinates.
function moveCrop(dx, dy) {
  if (!displayScale || !cropSquare || !mouseMovingCropParameter)
    return;

  var dxs = dx / displayScale;
  var dys = dy / displayScale;

  if (mouseMovingCropParameter.x) {
    cropSquare.x += dxs;
    cropSquare.w = Math.max(cropSquare.w - dxs, 0);
  }
  if (mouseMovingCropParameter.y) {
    cropSquare.y += dys;
    cropSquare.h = Math.max(cropSquare.h - dys, 0);
  }
  if (mouseMovingCropParameter.w) {
    cropSquare.w += dxs;
    if (cropSquare.w < 0) {
      cropSquare.x += cropSquare.w;
      cropSquare.w = 0;
    }
  }
  if (mouseMovingCropParameter.h) {
    cropSquare.h += dys;
    if (cropSquare.h < 0) {
      cropSquare.y += cropSquare.h;
      cropSquare.h = 0;
    }
  }

  // If not moving a particular element, move the whole frame.
  if (!mouseMovingCropParameter.x &&
      !mouseMovingCropParameter.y &&
      !mouseMovingCropParameter.w &&
      !mouseMovingCropParameter.h) {
    cropSquare.x += dxs;
    cropSquare.y += dys;
  }

  webkitRequestAnimationFrame(drawCanvas);
}

function updateScaleAndOffset() {
  if (!img.width || !img.height) {
    displayScale = undefined;
    displayOffset = undefined;
    return;
  }

  // scale such that image fits on canvas.
  displayScale = 0.9 * Math.min(
    canvas.width / img.width,
    canvas.height / img.height);

  // offset such that image is centered.
  displayOffset = {
    x: Math.max(0, canvas.width / displayScale - img.width) / 2,
    y: Math.max(0, canvas.height / displayScale - img.height) / 2
  };
}

function getRectInCanvasCoords(rect) {
  updateScaleAndOffset();
  if (!displayScale || !displayOffset)
    return rect;

  return {
    x: displayScale * (displayOffset.x + rect.x),
    y: displayScale * (displayOffset.y + rect.y),
    w: displayScale * rect.w,
    h: displayScale * rect.h
  };
}

function getRectInverted(rect) {
  return {
    x: rect.x,
    y: rect.y + rect.h,
    w: rect.w,
    h: -rect.h
  };
}

function addRightAndBottomToRect(rect) {
  rect.r = rect.x + rect.w;
  rect.b = rect.y + rect.h;
}

function getCropSquareHandlesInCanvasCoords() {
  var cropSquareInCanvasCoords = getRectInCanvasCoords(cropSquare);
  return {
      x: cropSquareInCanvasCoords.x - cropSquareHandlesSize,
      y: cropSquareInCanvasCoords.y - cropSquareHandlesSize,
      w: cropSquareInCanvasCoords.w + 2 * cropSquareHandlesSize,
      h: cropSquareInCanvasCoords.h + 2 * cropSquareHandlesSize
  };
}

function canvasRect(rect) {
  var rectAsInts = copyAsIntegerRect(rect);
  canvasContext.rect(rectAsInts.x, rectAsInts.y, rectAsInts.w, rectAsInts.h);
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
  var imgRect = { x: 0, y: 0, w: img.width, h: img.height };
  var imgRectXformed = getRectInCanvasCoords(imgRect);
  var cropXformed = getRectInCanvasCoords(cropSquare);

  if (displayScale >= 1)
    cc.imageSmoothingEnabled = false;
  console.log(cc.imageSmoothingEnabled);

  // Dim area under image.
  cc.save();
  cc.beginPath();
  cc.fillStyle = "rgba(0, 0, 0, 0.1)";
  canvasRect(imgRectXformed);
  cc.fill();
  cc.restore();

  cc.drawImage(img, imgRectXformed.x, imgRectXformed.y, imgRectXformed.w, imgRectXformed.h);

  // Draw crop window.
  cc.save();
  cc.translate(0.5, 0.5); // draw lines directly on pixels, no anti-aliasing.
  cc.beginPath();
  canvasRect(cropXformed);
  cc.lineWidth = 1;
  cc.strokeStyle = "rgba(255, 255, 255, 0.5)";
  cc.stroke(); // File whole line white.
  cc.setLineDash([5]);
  cc.strokeStyle = "rgba(0, 0, 0, 0.5)";
  cc.strokeStyle = "black"; // Dash the line black.
  cc.stroke();
  cc.restore();
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
  img.onerror = imageHasLoaded;
  img.src = url;
}

function imageHasLoaded() {
  if (img.width && img.height) {
    cropButton.disabled = false;
  } else {
    displayText("Image failed to load.");
    saveFileButton.disabled = true;
    cropButton.disabled = true;
  }
  resetCrop();
  drawCanvas();
}

function writeFileEntry(writableEntry, opt_blob, callback) {
  if (!writableEntry) {
    displayText('Nothing selected.');
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
    saveFileButton.disabled = true;
    loadImageFromFile(file);
    displayfileEntryPath(chosenFileEntry);
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
  displayText("Cropped.");
  saveFileButton.disabled = false;
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
      displayText('No file selected.');
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
      displayText('Write complete :)');
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
    displayText("Sorry, could not load file.");
    return;
  } else {
    displayText("Loading dropped file.");
  }

  loadFileEntry(chosenFileEntry);
}

chooseFileButton.addEventListener('click', chooseFile);
// mousedown on canvas so that interaction only ever starts from the work area.
canvas.addEventListener('mousedown', mouseDown);
window.addEventListener('mouseup', stopTrackingMouseDrag);
window.addEventListener('blur', stopTrackingMouseDrag);
// mousemove on window so that mouse is captured during a drag, keeping
// updates coming to the window and updating the app.
window.addEventListener('mousemove', mouseMove);
cropButton.addEventListener('click', crop);
saveFileButton.addEventListener('click', saveFile);
new DnDFileController('body', draggedDataDropped);

loadInitialFile(launchData);
