// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// Metadata is stored in files as serialized to JSON maps. See contents of
// example1.fake and example2.fake.

// Multiple volumes can be opened at the same time. The key is the
// fileSystemId, which is the same as the file's displayPath.
// The value is a Volume object.
var volumes = {};

// Defines a volume object that contains information about a mounted file
// system.
function Volume(entry, metadata, openedFiles) {
  // Used for restoring the opened file entry after resuming the event page.
  this.entry = entry;

  // The volume metadata.
  this.metadata = [];
  for (var path in metadata) {
    this.metadata[path] = metadata[path];
    // Date object is serialized in JSON as string.
    this.metadata[path].modificationTime =
        new Date(metadata[path].modificationTime);
  }

  // A map with currently opened files. The key is a requestId value from the
  // openFileRequested event, and the value is the file path.
  this.openedFiles = openedFiles;
};

function onUnmountRequested(options, onSuccess, onError) {
  restoreState(options.fileSystemId, function() {
    if (Object.keys(volumes[options.fileSystemId].openedFiles).length != 0) {
      onError('IN_USE');
      return;
    }

    chrome.fileSystemProvider.unmount(
        {fileSystemId: options.fileSystemId},
        function() {
          if (chrome.runtime.lastError) {
            onError(chrome.runtime.lastError.message);
            return;
          }
          delete volumes[options.fileSystemId];
          saveState();  // Remove volume from local storage state.
          onSuccess();
        });
  }, onError);
};

function onGetMetadataRequested(options, onSuccess, onError) {
  restoreState(options.fileSystemId, function () {
    var entryMetadata =
        volumes[options.fileSystemId].metadata[options.entryPath];
    if (!entryMetadata)
      error('NOT_FOUND');
    else
      onSuccess(entryMetadata);
  }, onError);
};

function onReadDirectoryRequested(options, onSuccess, onError) {
  restoreState(options.fileSystemId, function () {
    var directoryMetadata =
        volumes[options.fileSystemId].metadata[options.directoryPath];
    if (!directoryMetadata) {
      onError('NOT_FOUND');
      return;
    }
    if (!directoryMetadata.isDirectory) {
      onError('NOT_A_DIRECTORY');
      return;
    }

    // Retrieve directory contents from metadata.
    var entries = [];
    for (var entry in volumes[options.fileSystemId].metadata) {
      // Do not add itself on the list.
      if (entry == options.directoryPath)
        continue;
      // Check if the entry is a child of the requested directory.
      if (entry.indexOf(options.directoryPath) != 0)
        continue;
      // Restrict to direct children only.
      if (entry.substring(options.directoryPath.length + 1).indexOf('/') != -1)
        continue;

      entries.push(volumes[options.fileSystemId].metadata[entry]);
    }
    onSuccess(entries, false /* Last call. */);
  }, onError);
};

function onOpenFileRequested(options, onSuccess, onError) {
  restoreState(options.fileSystemId, function () {
    if (options.mode != 'READ' || options.create) {
      onError('INVALID_OPERATION');
    } else {
      volumes[options.fileSystemId].openedFiles[options.requestId] =
          options.filePath;
      onSuccess();
    }
  }, onError);
};

function onCloseFileRequested(options, onSuccess, onError) {
  restoreState(options.fileSystemId, function () {
    if (!volumes[options.fileSystemId].openedFiles[options.openRequestId]) {
      onError('INVALID_OPERATION');
    } else {
      delete volumes[options.fileSystemId].openedFiles[options.openRequestId];
      onSuccess();
    }
  }, onError);
};

function onReadFileRequested(options, onSuccess, onError) {
  restoreState(options.fileSystemId, function () {
    var filePath =
        volumes[options.fileSystemId].openedFiles[options.openRequestId];
    if (!filePath) {
      onError('INVALID_OPERATION');
      return;
    }

    var contents = volumes[options.fileSystemId].metadata[filePath].contents;

    // Write the contents as ASCII text.
    var buffer = new ArrayBuffer(options.length);
    var bufferView = new Uint8Array(buffer);
    for (var i = 0; i < options.length; i++) {
      bufferView[i] = contents.charCodeAt(i);
    }

    onSuccess(buffer, false /* Last call. */);
  }, onError);
};

// Saves state in case of restarts, event page suspend, crashes, etc.
function saveState() {
  var state = {};
  for (var volumeId in volumes) {
    var entryId = chrome.fileSystem.retainEntry(volumes[volumeId].entry);
    state[volumeId] = {
      entryId: entryId
    };
  }
  chrome.storage.local.set({state: state});
}

// Restores metadata for the passed file system ID.
function restoreState(fileSystemId, onSuccess, onError) {
  chrome.storage.local.get(['state'], function(result) {
    // Check if metadata for the given file system is already in memory.
    if (volumes[fileSystemId]) {
      onSuccess();
      return;
    }

    chrome.fileSystem.restoreEntry(
        result.state[fileSystemId].entryId,
        function(entry) {
          readMetadataFromFile(entry,
              function(metadata) {
                chrome.fileSystemProvider.get(fileSystemId, function(info) {
                  if (chrome.runtime.lastError) {
                    onError(chrome.runtime.lastError.message);
                    return;
                  }
                  volumes[fileSystemId] = new Volume(entry, metadata,
                      info.openedFiles);
                  onSuccess();
                });
              }, onError);
        });
  });
}

// Reads metadata from a file and returns it with the onSuccess callback.
function readMetadataFromFile(entry, onSuccess, onError) {
  entry.file(function(file) {
    var fileReader = new FileReader();
    fileReader.onload = function(event) {
      onSuccess(JSON.parse(event.target.result));
    };

    fileReader.onerror = function(event) {
      onError('FAILED');
    };

    fileReader.readAsText(file);
  });
}

// Event called on opening a file with the extension or mime type
// declared in the manifest file.
chrome.app.runtime.onLaunched.addListener(function(event) {
  event.items.forEach(function(item) {
    readMetadataFromFile(item.entry,
        function(metadata) {
          // Mount the volume and save its information in local storage
          // in order to be able to recover the metadata in case of
          // restarts, system crashes, etc.
          chrome.fileSystem.getDisplayPath(item.entry, function(displayPath) {
            volumes[displayPath] = new Volume(item.entry, metadata, []);
            chrome.fileSystemProvider.mount(
                {fileSystemId: displayPath, displayName: item.entry.name},
                function() {
                  if (chrome.runtime.lastError) {
                    console.error('Failed to mount because of: ' +
                        chrome.runtime.lastError.message);
                    return;
                  };
                  saveState();
                });
          });
        },
        function(error) {
          console.error(error);
        });
  });
});

// Event called on a profile startup.
chrome.runtime.onStartup.addListener(function () {
  chrome.storage.local.get(['state'], function(result) {
    // Nothing to change.
    if (!result.state)
      return;

    chrome.storage.local.set({state: result.state});
  });
});

// Save the state before suspending the event page, so we can resume it
// once new events arrive.
chrome.runtime.onSuspend.addListener(function() {
  saveState();
});

chrome.fileSystemProvider.onUnmountRequested.addListener(
    onUnmountRequested);
chrome.fileSystemProvider.onGetMetadataRequested.addListener(
    onGetMetadataRequested);
chrome.fileSystemProvider.onReadDirectoryRequested.addListener(
    onReadDirectoryRequested);
chrome.fileSystemProvider.onOpenFileRequested.addListener(
    onOpenFileRequested);
chrome.fileSystemProvider.onCloseFileRequested.addListener(
    onCloseFileRequested);
chrome.fileSystemProvider.onReadFileRequested.addListener(
    onReadFileRequested);
