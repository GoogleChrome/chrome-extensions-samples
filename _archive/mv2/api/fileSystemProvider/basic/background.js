// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// Fake data similar to a file system structure.
var MODIFICATION_DATE = new Date();
var SHORT_CONTENTS = 'Just another example.';
var LONGER_CONTENTS = 'It works!\nEverything gets displayed correctly.';

var METADATA = {
  '/': {isDirectory: true, name: '', size: 0,
      modificationTime: MODIFICATION_DATE},
  '/file1.txt': {isDirectory: false, name: 'file1.txt',
      size: LONGER_CONTENTS.length, modificationTime: MODIFICATION_DATE,
      contents: LONGER_CONTENTS},
  '/file2': {isDirectory: false, name: 'file2', size: 150,
      modificationTime: MODIFICATION_DATE},
  '/dir': {isDirectory: true, name: 'dir', size: 0,
      modificationTime: MODIFICATION_DATE},
  '/dir/file3.txt': {isDirectory: false, name: 'file3.txt',
      size: SHORT_CONTENTS.length, modificationTime: MODIFICATION_DATE,
      contents: SHORT_CONTENTS}};

// A map with currently opened files. As key it has requestId of
// openFileRequested and as a value the file path.
var openedFiles = {};

function onGetMetadataRequested(options, onSuccess, onError) {
  if (!METADATA[options.entryPath])
    onError('NOT_FOUND');
  else
    onSuccess(METADATA[options.entryPath]);
}

function onReadDirectoryRequested(options, onSuccess, onError) {
  if (!METADATA[options.directoryPath]) {
    onError('NOT_FOUND');
    return;
  }
  if (!METADATA[options.directoryPath].isDirectory) {
    onError('NOT_A_DIRECTORY');
    return;
  }

  // Retrieve directory contents from METADATA.
  var entries = [];
  for (var entry in METADATA) {
    // Do not add itself on the list.
    if (entry == options.directoryPath)
      continue;
    // Check if the entry is a child of the requested directory.
    if (entry.indexOf(options.directoryPath) != 0)
      continue;
    // Restrict to direct children only.
    if (entry.substring(options.directoryPath.length + 1).indexOf('/') != -1)
      continue;

    entries.push(METADATA[entry]);
  }
  onSuccess(entries, false /* Last call. */);
}

function onOpenFileRequested(options, onSuccess, onError) {
  if (options.mode != 'READ' || options.create) {
    onError('INVALID_OPERATION');
  } else {
    openedFiles[options.requestId] = options.filePath;
    onSuccess();
  }
}

function onCloseFileRequested(options, onSuccess, onError) {
  if (!openedFiles[options.openRequestId]) {
    onError('INVALID_OPERATION');
  } else {
    delete openedFiles[options.openRequestId];
    onSuccess();
  }
}

function onReadFileRequested(options, onSuccess, onError) {
  if (!openedFiles[options.openRequestId]) {
    onError('INVALID_OPERATION');
    return;
  }

  var contents =
      METADATA[openedFiles[options.openRequestId]].contents;

  var remaining = Math.max(0, contents.length - options.offset);
  var length = Math.min(remaining, options.length);

  // Write the contents as ASCII text.
  var buffer = new ArrayBuffer(length);
  var bufferView = new Uint8Array(buffer);
  for (var i = 0; i < length; i++) {
    bufferView[i] = contents.charCodeAt(i + options.offset);
  }

  onSuccess(buffer, false /* Last call. */);
}

function onMountRequested(onSuccess, onError) {
  chrome.fileSystemProvider.mount(
      {fileSystemId: 'sample-file-system', displayName: 'Sample File System'},
      function() {
        if (chrome.runtime.lastError) {
          onError(chrome.runtime.lastError.message);
          console.error('Failed to mount because of: ' +
              chrome.runtime.lastError.message);
          return;
        }
        onSuccess();
      });
}

function onUnmountRequested(options, onSuccess, onError) {
  chrome.fileSystemProvider.unmount(
      {fileSystemId: options.fileSystemId},
      function() {
        if (chrome.runtime.lastError) {
          onError(chrome.runtime.lastError.message);
          console.error('Failed to unmount because of: ' +
              chrome.runtime.lastError.message);
          return;
        }
        onSuccess();
      });
}

chrome.fileSystemProvider.onGetMetadataRequested.addListener(
    onGetMetadataRequested);
chrome.fileSystemProvider.onReadDirectoryRequested.addListener(
    onReadDirectoryRequested);
chrome.fileSystemProvider.onOpenFileRequested.addListener(onOpenFileRequested);
chrome.fileSystemProvider.onCloseFileRequested.addListener(
    onCloseFileRequested);
chrome.fileSystemProvider.onReadFileRequested.addListener(onReadFileRequested);
chrome.fileSystemProvider.onMountRequested.addListener(onMountRequested);
chrome.fileSystemProvider.onUnmountRequested.addListener(onUnmountRequested);
