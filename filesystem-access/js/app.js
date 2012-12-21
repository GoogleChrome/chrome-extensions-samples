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

var chosenFileEntry = null;
var writeFileButton = document.querySelector('#write_file');
var chooseFileButton = document.querySelector('#choose_file');
var saveFileButton = document.querySelector('#save_file');
var output = document.querySelector('output');
var textarea = document.querySelector('textarea');


chooseFileButton.addEventListener('click', function(e) {
  // "type/*" mimetypes aren't respected. Explicitly use extensions for now.
  // See crbug.com/145112.
  var accepts = [{
    //mimeTypes: ['text/*'],
    extensions: ['js', 'css', 'txt', 'html', 'xml', 'tsv', 'csv', 'rtf']
  }];
  chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(readOnlyEntry) {
    if (!readOnlyEntry) {
      output.textContent = 'No file selected.';
      return;
    }

    chosenFileEntry = readOnlyEntry;

    chosenFileEntry.file(function(file) {
      readAsText(readOnlyEntry, function(result) {
        textarea.value = result;
      });
      // Update display.
      writeFileButton.disabled = false;
      saveFileButton.disabled = false;
      displayPath(chosenFileEntry);
    });
  });
});

// writeFileButton.addEventListener('click', function(e) {
//   if (chosenFileEntry) {
//    chrome.fileSystem.getWritableEntry(chosenFileEntry, function(writableEntry) {
//       writeFileEntry(writableEntry, null, function(e) {
//         output.textContent = 'Write complete :)';
//       });
//    });
//   }
// });

saveFileButton.addEventListener('click', function(e) {
  var config = {type: 'saveFile', suggestedName: chosenFileEntry.name};
  chrome.fileSystem.chooseEntry(config, function(writableEntry) {
    var blob = new Blob([textarea.value], {type: 'text/plain'});
    writeFileEntry(writableEntry, blob, function(e) {
      output.textContent = 'Write complete :)';
    });
  });
});

// Support dropping a single file onto this app.
var dnd = new DnDFileController('body', function(data) {
  var item = data.items[0];
  if (!item.type.match('text/*')) {
    output.textContent = "Sorry. That's not a text file.";
    return;
  }

  chosenFileEntry = item.webkitGetAsEntry();
  readAsText(chosenFileEntry, function(result) {
    textarea.value = result;
  });
  // Update display.
  writeFileButton.disabled = false;
  saveFileButton.disabled = false;
  displayPath(chosenFileEntry);
});
