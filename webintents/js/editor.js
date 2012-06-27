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

Author: Kinuko Yasuda (kinuko@chromium.org),
        Eiji Kitamura (agektmr@chromium.org)
*/
var editor = editor || {};
editor.verbose = editor.verbose || false;

editor.debug = function() {
  if (editor.verbose)
    console.log(arguments);
};

editor.error = function() {
  console.log('ERROR:', arguments);
  var message = '';
  for (var i = 0; i < arguments.length; i++) {
    var description = '';
    if (arguments[i] instanceof FileError) {
      switch (arguments[i].code) {
        case FileError.QUOTA_EXCEEDED_ERR:
          description = 'QUOTA_EXCEEDED_ERR';
          break;
        case FileError.NOT_FOUND_ERR:
          description = 'NOT_FOUND_ERR';
          break;
        case FileError.SECURITY_ERR:
          description = 'SECURITY_ERR';
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          description = 'INVALID_MODIFICATION_ERR';
          break;
        case FileError.INVALID_STATE_ERR:
          description = 'INVALID_STATE_ERR';
          break;
        default:
          description = 'Unknown Error';
          break;
      }
      message += ': ' + description;
    } else if (arguments[i].fullPath) {
      message += arguments[i].fullPath + ' ';
    } else {
      message += arguments[i] + ' ';
    }
  }
  var e = document.getElementById('error');
  e.innerText = 'ERROR:' + message;
  e.classList.remove('hide');

  window.setTimeout(function() { e.innerHTML = ''; }, 5000);
};

editor.show = function(id) {
  document.getElementById(id).classList.remove('hide');
};

editor.hide = function(id) {
  document.getElementById(id).classList.add('hide');
};

editor.formatSize = function(size) {
  var unit = 0;
  while (size > 1024 && unit < 5) {
    size /= 1024;
    unit++;
  }
  size = Math.floor(size);
  return size + ['', 'K', 'M', 'G', 'T'][unit] + 'B';
}

// Returns relative mouse position in the client rect.
editor.getMousePosition = function(e) {
  var rect = e.target.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
editor.dataURIToBlob = function(dataURI) {
  var bytes = window.atob(dataURI.split(',')[1]);
  var mimeType = dataURI.split(',')[0].split(':')[1].split(':')[0];

  var arrayBuffer = new ArrayBuffer(bytes.length);
  var data = new Uint8Array(arrayBuffer);
  for (var i = 0; i < bytes.length; ++i) {
    data[i] = bytes.charCodeAt(i);
  }

  var bb = new window.WebKitBlobBuilder();
  bb.append(arrayBuffer);
  return bb.getBlob(mimeType);
};

// Connect everything together.
editor.initialize = function(launchFile) {
  // For verbose logging.
  editor.verbose = true;

  var filer = new editor.Filer('file_input', 'native_file_input',
                               'save_button', 'saveas_button', 'open_button',
                               'file_chooser');
  var canvas = new editor.Canvas('draw_area');
  var pencil = new editor.Pencil('pencil_area', canvas);
  var colorPicker = new editor.ColorPicker(
      'color_picker',
      {
        onpick: function(c) { pencil.setStrokeColor(c); },
        colorsPerLine: 2,
        colorElems: ['0', 'f']
      });
  var brushPicker = new editor.BrushPicker(
      'brush_picker',
      { onpick: function(w) { pencil.setLineWidth(w); } });

  var clear = document.getElementById('clear_button');
  clear.addEventListener('click', function() { canvas.clear(); });

  var undo = document.getElementById('undo_button');
  undo.addEventListener('click', function() { canvas.undo(); });

  // Set canvas as the filer's data source/sink.
  filer.dataSource = canvas;
  filer.dataLoader = canvas;

  if (launchFile) {
    // If native file have been passed directly
    filer.openNativeFile(launchFile);
  } else {
    // Try loading the default image if we have.
    canvas.fromURL(filer.getSaveFileURL());
  }

  // On edit: re-enable save and undo.
  canvas.onedit = function() {
    filer.enableSave.apply(filer);
    undo.disabled = false;
  };
  // On undo: re-enable save and disable undo.
  canvas.onundo = function() {
    filer.enableSave.apply(filer);
    undo.disabled = true;
  };
};
