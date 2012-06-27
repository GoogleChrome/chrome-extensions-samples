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

Author: Kinuko Yasuda (kinuko@chromium.org)
*/
var editor = editor || {};

editor.createElement = function(name, attributes) {
  var elem = document.createElement(name);
  for (var key in attributes)
    elem.setAttribute(key, attributes[key]);
  return elem;
};

editor.joinPath = function(a, b) {
  if (a == '/')
    return b;
  return a + '/' + b;
};

editor.FileChooser = function(id) {
  this.chooserElement = document.getElementById(id);
  this.fileSystem = null;

  // Directory path => ul node mapping.
  var nodes = {};
  this.getListNode = function(path) { return nodes[path]; };
  this.setListNode = function(path, node) { nodes[path] = node; };

  // For 'New Folder'.
  this.currentDirectoryPath = null;

  // Set up root ul node.
  var list = document.getElementById('file_list_body');
  var rootul = document.createElement('ul');
  list.insertBefore(rootul, document.getElementById('file_list_empty_label'));
  this.getRootNode = function() { return rootul; };
  this.resetRootNode = function(dir) {
    rootul.innerHTML = "";
    nodes[dir.fullPath] = rootul;
    this.currentDirectoryPath = dir.fullPath;
  };

  var closed = false;
  this.isClosed = function() { return closed; }

  this.openChooser = function() {
    closed = false;
    this.chooserElement.classList.remove('hide');
  };

  this.closeChooser = function() {
    closed = true;
    this.chooserElement.classList.add('hide');
  };

  this.cancel = function() {
    this.closeChooser();
    this.oncancel();
  };

  // Install key handler to let 'Esc' close the chooser.
  document.onkeydown = function(ev) {
    if (ev.keyCode == 27 /* Esc */) this.cancel();
    return true;
  }.bind(this);

  document.getElementById('file_chooser_closer').addEventListener(
      'click', this.cancel.bind(this));
  document.getElementById('file_chooser_mkdir').addEventListener(
      'click', this.createDirectory.bind(this));

  var newFileInput = document.getElementById('file_new_input');
  newFileInput.addEventListener(
      'keydown',
      function(ev) {
        if (ev.keyCode == 13 /* Enter */) {
          this.onselect(newFileInput.value);
          this.closeChooser();
        }
      }.bind(this));
  this.setNewPath = function(path) {
    if (/^\//.test(path))
      path = path.substring(1);
    newFileInput.value = path;
  }

  document.getElementById('file_new_submit').addEventListener(
      'click',
      function() {
        this.onselect(newFileInput.value);
        this.closeChooser();
      }.bind(this));
};

editor.FileChooser.prototype.open = function(dir, options) {
  this.fileSystem = dir.filesystem;
  this.onopen = options && options.onopen || function(){};
  this.oncancel = options && options.oncancel || function(){};
  this.onselect = options && options.onselect || function(){};
  this.resetRootNode(dir);
  editor.hide('file_list_body');
  editor.show('file_list_empty_label');
  editor.show('file_list_loading');
  if (options && options.forNewEntry) {
    editor.show('file_chooser_mkdir');
    editor.show('file_chooser_new');
  } else {
    editor.hide('file_chooser_mkdir');
    editor.hide('file_chooser_new');
  }
  this.openChooser();
  this.openDirectory(dir);
};

editor.FileChooser.prototype.addEntry = function(parentNode, entry, file) {
  var li = editor.createElement('li', {title: entry.name});
  var node = document.createElement('div');
  node.classList.add(entry.isFile ? 'file' : 'dir');
  node.classList.add('entry');
  var a = editor.createElement('a', {href: '#'});
  a.appendChild(document.createTextNode(entry.name));
  node.appendChild(a);
  li.appendChild(node);

  if (entry.isFile) {
    // Show size in a separate div '<div>[size] KB</div>'
    var sizeDiv = editor.createElement('div', {'class': 'size'});
    sizeDiv.appendChild(document.createTextNode(editor.formatSize(file.size)));
    node.appendChild(sizeDiv);
    a.addEventListener('click', this.didChooseFile.bind(this, entry));
    // Add dragstart listener so that we can drag-out the file.
    a.addEventListener('dragstart', function(ev) {
      var downloadURL = 'image/png:' + entry.name + ':' + entry.toURL();
      ev.dataTransfer.setData('DownloadURL', downloadURL);
    });
  } else {
    node.opened = false;
    var ul = document.createElement('ul');
    li.appendChild(ul);
    this.setListNode(entry.fullPath, ul);
    // Install click handler to open/close the directory.
    node.addEventListener(
        'click', this.didChooseDirectory.bind(this, node, entry));
  }

  // Show delete button.
  var deleteButton = editor.createElement(
      'input', { 'class': 'delete', 'type': 'button', 'value': 'Delete' });
  node.appendChild(deleteButton);
  deleteButton.addEventListener('click', function(ev) {
    ev.stopPropagation();
    if (entry.isFile) {
      entry.remove(parentNode.removeChild.bind(parentNode, li),
                   editor.error.bind(this, "remove:", entry));
    } else {
      entry.removeRecursively(parentNode.removeChild.bind(parentNode, li),
                              editor.error.bind(this, "remove:", entry));
    }
  });

  parentNode.appendChild(li);
};

editor.FileChooser.prototype.didChooseDirectory = function(node, dirEntry) {
  this.cancelMkdir();
  this.setNewPath(dirEntry.fullPath + '/');
  var ul = this.getListNode(dirEntry.fullPath);
  node.classList.toggle('open');
  if (node.opened) {
    var path = dirEntry.fullPath;
    var parentPath = path.substring(0, path.lastIndexOf('/'));
    if (parentPath.length > 0)
      this.currentDirectoryPath = parentPath;
    else
      this.currentDirectoryPath = '/';
    ul.innerHTML = "";
    node.opened = false;
  } else {
    this.currentDirectoryPath = dirEntry.fullPath;
    this.openDirectory(dirEntry);
    node.opened = true;
  }
};

editor.FileChooser.prototype.didChooseFile = function(fileEntry) {
  this.cancelMkdir();
  this.onopen(fileEntry);
  this.onselect(fileEntry.fullPath);
  this.closeChooser();
};

editor.FileChooser.prototype.openDirectory = function(dir) {
  var reader = dir.createReader();
  reader.readEntries(
      this.didReadEntries.bind(this, dir, reader),
      editor.error.bind(this, "readEntries:", dir, this.openDirectory.caller));
};

editor.FileChooser.prototype.didReadEntries = function(dir, reader, entries) {
  if (this.isClosed())
    return;

  editor.show('file_list_body');
  if (entries.length == 0) {
    editor.hide('file_list_loading');
    return;
  }

  editor.hide('file_list_empty_label');
  var node = this.getListNode(dir.fullPath);
  for (var i = 0; i < entries.length; ++i) {
    if (entries[i].isFile) {
      // Get File object so that we can show the file size.
      entries[i].file(this.addEntry.bind(this, node, entries[i]),
                      editor.error.bind(this, "Entry.file:", entries[i]));
    } else {
      this.addEntry(node, entries[i]);
    }
  }

  // Continue reading.
  reader.readEntries(
      this.didReadEntries.bind(this, dir, reader),
      editor.error.bind(this, "readEntries (contd):", dir));
};

editor.FileChooser.prototype.cancelMkdir = function() {
  if (this.currentDirectoryPath) {
    var parentNode = this.getListNode(this.currentDirectoryPath);
    var pending = document.getElementById('pending_mkdir_node');
    if (pending)
      parentNode.removeChild(pending);
  }
};

editor.FileChooser.prototype.createDirectory = function() {
  if (this.isClosed() || !this.fileSystem)
    return;
  this.cancelMkdir();
  var parentNode = this.getListNode(this.currentDirectoryPath);
  if (!parentNode) {
    editor.error('FATAL: No currentNode selected.');
    return;
  }
  var suffix = 0;
  var getNewName = function() {
    if (suffix) return 'New Folder ' + suffix;
    return 'New Folder';
  };
  var children = parentNode.childNodes;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    var title = child.getAttribute('title');
    if (child.tagName.toLowerCase() == 'li' && title) {
      while (getNewName() == title)
        suffix++;
    }
  }
  var li = document.createElement('li');
  li.id = "pending_mkdir_node";
  var node = editor.createElement('div', {'class': 'entry dir'});
  var mkdirInput = editor.createElement(
    'input', { 'type': 'text', 'value': getNewName() });
  var mkdirSubmit = editor.createElement(
    'input', { 'type': 'button', 'value': 'Create' });
  mkdirSubmit.addEventListener(
      'click',
      function() {
        var path = editor.joinPath(this.currentDirectoryPath, mkdirInput.value);
        this.fileSystem.root.getDirectory(
            path, {create:true, exclusive:true},
            this.didCreateDirectory.bind(this, parentNode),
            editor.error.bind(this, 'createDirectory:', path));
      }.bind(this));
  node.appendChild(mkdirInput);
  node.appendChild(mkdirSubmit);
  li.appendChild(node);
  parentNode.appendChild(li);
};

editor.FileChooser.prototype.didCreateDirectory = function(parentNode, dir) {
  this.cancelMkdir();
  this.addEntry(parentNode, dir);
};
