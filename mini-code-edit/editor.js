var newButton, openButton, saveButton;
var editor;
var fileEntry;
var hasWriteAccess;
var isCrOS = false;

function errorHandler(e) {
  var msg = "";

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
    msg = "QUOTA_EXCEEDED_ERR";
    break;
    case FileError.NOT_FOUND_ERR:
    msg = "NOT_FOUND_ERR";
    break;
    case FileError.SECURITY_ERR:
    msg = "SECURITY_ERR";
    break;
    case FileError.INVALID_MODIFICATION_ERR:
    msg = "INVALID_MODIFICATION_ERR";
    break;
    case FileError.INVALID_STATE_ERR:
    msg = "INVALID_STATE_ERR";
    break;
    default:
    msg = "Unknown Error";
    break;
  };

  console.log("Error: " + msg);
}

function handleDocumentChange(title) {
  var mode = "javascript";
  var modeName = "JavaScript";
  if (title) {
    title = title.match(/[^/]+$/)[0];
    document.getElementById("title").innerHTML = title;
    document.title = title;
    if (title.match(/.json$/)) {
      mode = {name: "javascript", json: true};
      modeName = "JavaScript (JSON)";
    } else if (title.match(/.html$/)) {
      mode = "htmlembedded";
      modeName = "HTML";
    } else if (title.match(/.css$/)) {
      mode = "css";
      modeName = "CSS";
    }
  } else {
    document.getElementById("title").innerHTML = "[no document loaded]";
  }
  editor.setOption("mode", mode);
  document.getElementById("mode").innerHTML = modeName;
}

function newFile() {
  fileEntry = null;
  hasWriteAccess = false;
  handleDocumentChange(null);
}

function setFile(theFileEntry, isWritable) {
  fileEntry = theFileEntry;
  hasWriteAccess = isWritable;
}

function readFileIntoEditor(theFileEntry) {
  if (theFileEntry) {
    theFileEntry.file(function(file) {
      var fileReader = new FileReader();

      fileReader.onload = function(e) {
        handleDocumentChange(theFileEntry.fullPath);
        editor.setValue(e.target.result);
      };

      fileReader.onerror = function(e) {
        console.log("Read failed: " + e.toString());
      };

      fileReader.readAsText(file);
    }, errorHandler);
  }
}

function writeEditorToFile(theFileEntry) {
  theFileEntry.createWriter(function(fileWriter) {

    fileWriter.onwriteend = function(e) {
      handleDocumentChange(theFileEntry.fullPath);
      console.log("Write completed.");
    };

    fileWriter.onerror = function(e) {
      console.log("Write failed: " + e.toString());
    };

    var blob = new Blob([editor.getValue()]);
    fileWriter.write(blob);
  }, errorHandler);
}

var onChosenFileToOpen = function(theFileEntry) {
  setFile(theFileEntry, false);
  readFileIntoEditor(theFileEntry);
};

var onWritableFileToOpen = function(theFileEntry) {
  setFile(theFileEntry, true);
  readFileIntoEditor(theFileEntry);
};

var onChosenFileToSave = function(theFileEntry) {
  setFile(theFileEntry, true);
  writeEditorToFile(theFileEntry);
};

function handleNewButton() {
  if (false) {
    newFile();
    editor.setValue("");
  } else {
    chrome.appWindow.create('main.html', {
      frame: 'chrome', width: 720, height: 400
    });
  }
}

function handleOpenButton() {
  chrome.fileSystem.chooseFile({ type: 'openFile' }, onChosenFileToOpen);
}

function handleSaveButton() {
  if (fileEntry && hasWriteAccess) {
    writeEditorToFile(fileEntry);
  } else {
    if (isCrOS) {
      chrome.fileBrowserHandler.selectFile({ "suggestedName": "new_file.txt" },
        function(selectInfo) {
          setFile(selectInfo.entry, true);
          handleSaveButton();
        }
      );
    } else {
      chrome.fileSystem.chooseFile({ type: 'saveFile' }, onChosenFileToSave);
    }
  }
}

window.onload = function() {
  // TODO: since chrome.fileSystem seems to be the future, this test should
  // hinge on availablility of that API rather than absence of this one.
  isCrOS = (typeof chrome.fileBrowserHandler != 'undefined');

  newButton = document.getElementById("new");
  openButton = document.getElementById("open");
  saveButton = document.getElementById("save");

  newButton.addEventListener("click", handleNewButton);
  saveButton.addEventListener("click", handleSaveButton);

  editor = CodeMirror.fromTextArea(document.getElementById("editor"),
    { mode: {name: "javascript", json: true },
      lineNumbers: true,
      theme: "lesser-dark",
      extraKeys: {
        "Cmd-S": function(instance) { handleSaveButton() },
        "Ctrl-S": function(instance) { handleSaveButton() },
      }
    });

  if (isCrOS) {
    // file_browser_handlers aren't available for apps, grrr.
    openButton.disabled = true;
  } else {
    // We don't appear to be running on CrOS. Use chrome.fileSystem instead.
    openButton.addEventListener("click", handleOpenButton);
  }
  newFile();
};
