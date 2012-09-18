define(function(require, exports, module) {
"use strict";

// Load dependent modules
var EditSession = require("ace/edit_session").EditSession;
var UndoManager = require("ace/undomanager").UndoManager;
var Editor = require("ace/editor").Editor;
var Renderer = require("ace/virtual_renderer").VirtualRenderer;
var modes = require("modes");
var event = require("ace/lib/event");

// Load theme info
var theme = require("ace/theme/textmate");

// Setup edited document and put it in the container
var container = document.getElementById("editor");
var editor = new Editor(new Renderer(container, theme));
var session = new EditSession('');
session.setUndoManager(new UndoManager());
editor.setSession(session);

// Make sure editor is kept to an appropriate size
function onResize() {
  var left = container.offsetLeft;
  var top = container.offsetTop;
  var width = document.documentElement.clientWidth - left;
  var height = document.documentElement.clientHeight - top;
  container.style.width = width + 'px';
  container.style.height = height + 'px';
  editor.resize();
}
window.onresize = onResize;
// Do resize once to get everything in a happy place.
onResize();

var fileEntry;
var gotWritable = false;
var modeDescription = '';

function updatePathTo(aPath) {
  var pathDisplay = aPath;
  if (modeDescription) {
    pathDisplay = pathDisplay + ' [' + modeDescription + ']';
  }
  document.getElementById('path').innerHTML = pathDisplay;
}

function updatePath() {
  if (fileEntry) {
    chrome.fileSystem.getDisplayPath(fileEntry, updatePathTo);
  } else {
    updatePathTo('[new file]');
  }
}

function updateModeForBaseName(aBaseName) {
  modeDescription = '';
  var mode = modes.getModeFromBaseName(aBaseName);
  if (mode) {
    editor.getSession().setMode(mode.mode);
    modeDescription = mode.desc;
  }
}

function showError(anError) {
  var errorEl = document.getElementById('error');
  errorEl.innerHTML = anError;
  document.getElementById('error').style.display = 'default';
}

function clearError() {
  document.getElementById('error').style.display = 'none';
}

function replaceDocContentsFromString(string) {
  editor.getSession().setValue(string);
}

function replaceDocContentsFromFile(file) {
  if (window.FileReader) {
    var reader = new FileReader();
    reader.onload = function() {
      replaceDocContentsFromString(reader.result);
    };
    reader.readAsText(file);
  }
}

function replaceDocContentsFromFileEntry() {
  fileEntry.file(replaceDocContentsFromFile);
}

function saveToEntry() {
  fileEntry.createWriter(function(fileWriter) {
    fileWriter.onwriteend = function(e) {
      if (this.error)
        gStatusEl.innerHTML = 'Error during write: ' + this.error.toString();
      else
        clearError();
    };

    var blob = new Blob([editor.getSession().getValue()], {type: 'text/plain'});
    fileWriter.write(blob);
  });
}

function setEntry(anEntry, isWritable, name) {
  fileEntry = anEntry;
  gotWritable = isWritable;
  if (fileEntry) {
    updateModeForBaseName(fileEntry.name);
  } else if (name) {
    updateModeForBaseName(name);
  }
  updatePath();
}

// Create a new document. This just wipes the old document.
function createNew() {
  replaceDocContentsFromString();
  setEntry(null, false);
}

function openFile() {
  chrome.fileSystem.chooseEntry(function (entry) {
    if (chrome.runtime.lastError) {
      showError(chrome.runtime.lastError.message);
      return;
    }
    clearError();
    setEntry(entry, false);
    replaceDocContentsFromFileEntry();
  });
}

function saveFile() {
  if (gotWritable) {
    saveToEntry();
  } else if (fileEntry) {
    chrome.fileSystem.getWritableEntry(fileEntry, function(entry) {
      if (chrome.runtime.lastError) {
        showError(chrome.runtime.lastError.message);
        return;
      }
      clearError();
      setEntry(entry, true);
      saveToEntry();
    });
  } else {
    saveAs();
  }
}

function saveAs() {
  chrome.fileSystem.chooseEntry({type: 'saveFile'}, function(entry) {
    if (chrome.runtime.lastError) {
      showError(chrome.runtime.lastError.message);
      return;
    }
    clearError();
    setEntry(entry, true);
    saveToEntry();
  });
}

// Setup commands
// New probably should warn the user as there is no undo!
document.getElementById('new').onclick = createNew;
document.getElementById('openfile').onclick = openFile;
document.getElementById('save').onclick = saveFile;
document.getElementById('saveas').onclick = saveAs;

editor.commands.addCommand({
    name: "new",
    bindKey: {
        win: "Ctrl-N",
        mac: "Command-N",
        sender: "editor"
    },
    exec: function() {
        createNew();
    }
});

editor.commands.addCommand({
    name: "open",
    bindKey: {
        win: "Ctrl-O",
        mac: "Command-O",
        sender: "editor"
    },
    exec: function() {
        openFile();
    }
});

editor.commands.addCommand({
    name: "save",
    bindKey: {
        win: "Ctrl-S",
        mac: "Command-S",
        sender: "editor"
    },
    exec: function() {
        saveFile();
    }
});

editor.commands.addCommand({
    name: "saveas",
    bindKey: {
        win: "Ctrl-Shift-S",
        mac: "Command-Shift-S",
        sender: "editor"
    },
    exec: function() {
        saveAs();
    }
});

editor.commands.addCommand({
    name: "copy",
    bindKey: {
        win: "Ctrl-C",
        mac: "Command-C",
        sender: "editor"
    },
    exec: function() {
        document.execCommand("copy");
    }
});

editor.commands.addCommand({
    name: "paste",
    bindKey: {
        win: "Ctrl-V",
        mac: "Command-V",
        sender: "editor"
    },
    exec: function() {
        document.execCommand("paste");
    }
});

editor.commands.addCommand({
    name: "cutX",
    bindKey: {
        win: "Ctrl-X",
        mac: "Command-X",
        sender: "editor"
    },
    exec: function() {
        document.execCommand("cut");
    }
});

// Handle drop events.
event.addListener(container, "drop", function(e) {
  var file = e.dataTransfer.files[0];
  replaceDocContentsFromFile(file);
  setEntry(null, false, file.name);
  return event.preventDefault(e);
});

// Setup any launch data.
if (launchData) {
  setEntry(launchData.intent.data, false);
  replaceDocContentsFromFileEntry();
}

});
