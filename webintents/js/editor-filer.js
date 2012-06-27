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

editor.Filer = function(file_input, native_file_input,
                        save_id, saveas_id, open_id, file_chooser) {
  this.dataSource = null;  // must provide toBlob(callback) method.
  this.dataLoader = null;  // must provide fromURL(url, callback) method.

  var fileSystem = null;

  var fileInput = document.getElementById(file_input);
  var saveButton = document.getElementById(save_id);
  var saveAsButton = document.getElementById(saveas_id);
  var openButton = document.getElementById(open_id);

  // Setup public accessors.
  this.getFileSystem = function() { return fileSystem; }
  this.getSaveFilepath = function() { return fileInput.value; };
  this.setSaveFilepath = function(path) { fileInput.value = path; };
  this.enableSave = function() { saveButton.disabled = false; }
  this.disableSave = function() { saveButton.disabled = true; }

  fileInput.addEventListener('keydown', this.enableSave.bind(this));

  this.chooser = new editor.FileChooser(file_chooser);

  var nativeInput = document.getElementById(native_file_input);
  nativeInput.addEventListener('change', this.didChooseNativeFile.bind(this));

  window.webkitRequestFileSystem(
      window.TEMPORARY,
      1024,
      function(fs) {
        // Request FileSystem succeeded.
        fileSystem = fs;
        openButton.disabled = false;
        saveAsButton.disabled = false;
        saveButton.addEventListener('click', this.save.bind(this));
        saveAsButton.addEventListener('click', this.saveAs.bind(this));
        openButton.addEventListener('click', this.open.bind(this));
      }.bind(this),
      function(e) {
        // Error case.
        saveButton.disabled = true;
        openButton.disabled = true;
        this.didFail('requestFileSystem', e);
      }.bind(this));
};

editor.Filer.prototype.save = function() {
  if (!this.dataSource) {
    editor.error('No dataSource specified', 'save');
    return;
  }

  var context = 'Saving to ' + this.getSaveFilepath();
  editor.debug(context);

  // Obtain Blob from the dataSource and call getFile() to save it into.
  this.dataSource.toBlob(function(blob) {
    this.getFileSystem().root.getFile(this.getSaveFilepath(),
                                      {create:true},
                                      this.doSave.bind(this, blob),
                                      editor.error.bind(this, context));
  }.bind(this));
};

editor.Filer.prototype.doSave = function(blob, fileEntry) {
  fileEntry.createWriter(
      function(fileWriter) {
        // Set up FileWriter callbacks.
        fileWriter.onwriteend = this.didSave.bind(this, fileEntry.fullPath);
        fileWriter.onerror = editor.error.bind(this, 'write failed');
        fileWriter.write(blob);
      }.bind(this),
      editor.error.bind(this, 'createWriter'));
};

editor.Filer.prototype.didSave = function(path, ev) {
  editor.debug('Saving ' + ev.total + ' bytes into ' + path + ' done.');
  this.disableSave();
};

editor.Filer.prototype.open = function() {
  this.chooser.open(this.getFileSystem().root,
                    { onopen: this.didOpen.bind(this) });
};

editor.Filer.prototype.didOpen = function(fileEntry) {
  this.setSaveFilepath(fileEntry.fullPath.substring(1));
  this.dataLoader.fromURL(fileEntry.toURL());
};

editor.Filer.prototype.saveAs = function() {
  this.chooser.open(this.getFileSystem().root,
                    {
                      onselect: this.didChooseFile.bind(this),
                      forNewEntry: true
                    });
};

editor.Filer.prototype.didChooseFile = function(path) {
  if (/^\//.test(path))
    path = path.substring(1);
  this.setSaveFilepath(path);
  this.save();
};

editor.Filer.prototype.didChooseNativeFile = function(ev) {
  ev.stopPropagation();
  ev.preventDefault();

  var files = ev.target.files;
  if (files.length < 1)
    return;

  this.openNativeFile(files[0]);
};

editor.Filer.prototype.openNativeFile = function(file) {
  this.setSaveFilepath(file);
  this.dataLoader.fromURL(window.webkitURL.createObjectURL(file));
};

editor.Filer.prototype.getSaveFileURL = function() {
  return 'filesystem:' + window.location.protocol +
      '//' + window.location.host + '/temporary/' + this.getSaveFilepath();
};
