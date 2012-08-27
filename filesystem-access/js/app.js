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

// document.addEventListener('load', function() {
//  if(!!window.webkitIntent) {
//    var action = window.webkitIntent.action;
//    var data = window.webkitIntent.data;
//    var type = window.webkitIntent.type;
// //window.webkitIntent.postResult(data); 
// //window.webkitIntent.postError();
// console.log(webkitIntent, action, data, type)
//  }
// }, false);

// // var intent = new WebKitIntent("http://webintents.org/edit", "image/png", "dataUri://");

// // window.navigator.webkitStartActivity(intent, function(data) {
// // // The data from the remote application is returned here.
// // });

function errorHandler(e) {
  console.error(e);
}

function displayPath(fileEntry) {
  chrome.fileSystem.getDisplayPath(fileEntry, function(path) {
    document.querySelector('#file_path').value = path;
  });
}

function readAsText(fileEntry, callback) {
  fileEntry.file(function(file) {
    var reader = new FileReader();

    reader.onerror = errorHandler;
    reader.onload = function(e) {
      callback(e.target.result);
    };

    reader.readAsText(file);
  });
}

function writeFileEntry(writableEntry, opt_blob, callback) {
  writableEntry.createWriter(function(writer) {

    writer.onerror = errorHandler;
    writer.onwriteend = callback;

    // If we have data, write it to the file. Otherwise, just use the file we
    // loaded.
    if (opt_blob) {
      writer.write(opt_blob);
    } else {
      choosenFileEntry.file(function(file) {
        writer.write(file);
      });
    }    
  }, errorHandler);
}

var choosenFileEntry = null;
var writeFileButton = document.querySelector('#write_file');
var chooseFileButton = document.querySelector('#choose_file');
var saveFileButton = document.querySelector('#save_file');
var output = document.querySelector('output');
var textarea = document.querySelector('textarea');


chooseFileButton.addEventListener('click', function(e) {
  chrome.fileSystem.chooseFile({type: 'openFile'}, function(readOnlyEntry) {
    choosenFileEntry = readOnlyEntry;

    // Can't restrict chooseFile to a mimetype. See https://crbug.com/133066.
    // Remove this lookup when that is supported.
    choosenFileEntry.file(function(file) {
      if (file.type.match(/text\/.*/)) {
        readAsText(readOnlyEntry, function(result) {
          textarea.value = result;
        });
        // Update display.
        writeFileButton.disabled = false;
        saveFileButton.disabled = false;
        displayPath(choosenFileEntry);
      } else {
        output.textContent = 'Not a text file';
      }
    });
  });
});

// writeFileButton.addEventListener('click', function(e) {
//   if (choosenFileEntry) {
//    chrome.fileSystem.getWritableFileEntry(choosenFileEntry, function(writableEntry) {
//       writeFileEntry(writableEntry, null, function(e) {
//         output.textContent = 'Write complete :)';
//       });
//    });
//   }
// });

saveFileButton.addEventListener('click', function(e) {
  chrome.fileSystem.chooseFile({type: 'saveFile'}, function(writableEntry) {
    var blob = new Blob([textarea.value], {type: 'text/plain'});
    writeFileEntry(writableEntry, blob, function(e) {
      output.textContent = 'Write complete :)';
    });
  });
});

// Support dropping a single file onto this app.
var dnd = new DnDFileController('body', function(data) {
  // [].forEach.call(files, function(file, i) {

  // });
  var fileEntry = data.items[0].webkitGetAsEntry();
  choosenFileEntry = fileEntry;
  displayPath(choosenFileEntry);
});
