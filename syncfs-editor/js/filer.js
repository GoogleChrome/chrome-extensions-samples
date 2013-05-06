Filer = function(filesystem, container, editor, isSyncable) {
  this.filesystem = filesystem;
  this.editor = editor;
  this.isSyncable = isSyncable;

  // Directory path => ul node mapping.
  var nodes = {};
  this.getListNode = function(path) { return nodes[path]; };
  this.setListNode = function(path, node) { nodes[path] = node; };

  var container = document.getElementById(container);
  container.innerHTML = '';

  var tools = createElement('div', {class: 'filer-tools'});
  tools.appendChild(createElement('span', {id:'filer-usage'}));
  tools.appendChild(createElement(
      'button', {id:'filer-reload', class:'button', innerText:'Reload'}));
  container.appendChild(tools);
  container.appendChild(createElement(
      'div', {id:'filer-empty-label', innerText:'-- empty --'}));

  // Accept dropping file(s).
  this.setupDragAndDrop(container);

  // Set up the root node.
  var rootNode = createElement('ul');
  this.setListNode('/', rootNode);
  container.appendChild(rootNode);

  this.reload = function() {
    rootNode.innerHTML = '';
    this.showUsage();
    this.list(filesystem.root);
  };
  $('#filer-reload').addEventListener('click', this.reload.bind(this));
  this.reload();

  if (this.isSyncable) {
    if (chrome.syncFileSystem.onFileStatusChanged) {
      chrome.syncFileSystem.onFileStatusChanged.addListener(
          function(detail) {
            if (detail.direction == 'remote_to_local') {
              info('File ' + detail.fileEntry.fullPath +
                   ' is ' + detail.action + ' by background sync.');
              if (this.editor.getCurrentPath() == detail.fileEntry.fullPath &&
                  detail.action == 'updated') {
                this.editor.fileHasNewData = true;
              }
            }
            this.reload();
          }.bind(this));
    }
    if (chrome.syncFileSystem.onServiceStatusChanged) {
      chrome.syncFileSystem.onServiceStatusChanged.addListener(
          function(detail) {
            log('Service state updated: ' + detail.state + ': '
                + detail.description);
          }.bind(this));
    }
  }
};

Filer.prototype.list = function(dir) {
  // TODO(kinuko): This should be queued up.
  var node = this.getListNode(dir.fullPath);
  if (node.fetching)
    return;
  node.fetching = true;
  var reader = dir.createReader();
  reader.readEntries(this.didReadEntries.bind(this, dir, reader), error);
};

Filer.prototype.didReadEntries = function(dir, reader, entries) {
  var node = this.getListNode(dir.fullPath);
  if (!entries.length) {
    node.fetching = false;
    return;
  }

  hide('#filer-empty-label');

  for (var i = 0; i < entries.length; ++i) {
    if (entries[i].isFile) {
      // Get File object so that we can show the file size.
      entries[i].file(this.addEntry.bind(this, node, entries[i]),
                      error.bind(null, "Entry.file:", entries[i]));
    } else {
      this.addEntry(node, entries[i]);
    }
  }

  // Continue reading.
  reader.readEntries(this.didReadEntries.bind(this, dir, reader), error);
};

Filer.prototype.rename = function(oldName, newName) {
  this.filesystem.root.getFile(
    oldName, {create:false},
    function(entry) {
      entry.moveTo(this.filesystem.root, newName,
                   log.bind(null, 'Renamed: ' + oldName + ' -> ' + newName),
                   error);
    }.bind(this), error.bind(null, 'getFile:' + oldName));
};

Filer.prototype.addEntry = function(parentNode, entry, file) {
  var li = createElement('li', {title: entry.name});
  var node = createElement('div');
  node.classList.add(entry.isFile ? 'file' : 'dir');
  node.classList.add('entry');
  var a = createElement('a', {href: '#'});
  var nameNode = document.createTextNode(entry.name);
  a.appendChild(nameNode);
  node.appendChild(a);
  li.appendChild(node);

  if (this.isSyncable && chrome.syncFileSystem.getFileStatus) {
    chrome.syncFileSystem.getFileStatus(entry, function(status) {
      node.classList.add(status);
    });
  }

  if (!entry.isFile) {
    console.log('Skipping directory:' + entry.fullPath);
    return;
  }

  // Show size in a separate div '<div>[size] KB</div>'
  var sizeDiv = createElement('div', {class:'size'});
  sizeDiv.appendChild(document.createTextNode(this.formatSize(file.size)));
  node.appendChild(sizeDiv);

  // Set up an input field and double-click handler for rename oepration.
  var inputNode = createElement(
    'input', {type:'text', value:entry.name, style:'display:inline-block'});
  inputNode.addEventListener('keydown', function(ev) {
    if (ev.keyCode == 13) {
      this.resetRenameFocus = null;
      var oldName = nameNode.textContent;
      var newName = inputNode.value;
      if (!validFileName(newName)) {
        inputNode.value = oldName;
        return;
      }
      nameNode.textContent = newName;
      a.replaceChild(nameNode, inputNode);
      if (oldName != newName)
        this.rename(oldName, newName);
    }
  }.bind(this));

  a.addEventListener('dblclick', function(ev) {
    if (this.resetRenameFocus)
      this.resetRenameFocus();
    this.resetRenameFocus = function() { a.replaceChild(nameNode, inputNode); };
    a.replaceChild(inputNode, nameNode);
    inputNode.focus();
  }.bind(this));

  // Set up click handler to open the file in the editor.
  a.addEventListener('click', function(ev) {
    if (this.resetRenameFocus) {
      this.resetRenameFocus();
      this.resetRenameFocus = null;
    }
    this.editor.open(nameNode.textContent);
  }.bind(this));

  // Show delete button.
  var deleteButton = createElement('button',
    {class:'button delete-button', innerText:'x'});
  node.appendChild(deleteButton);
  deleteButton.addEventListener('click', function(ev) {
    ev.stopPropagation();
    this.filesystem.root.getFile(
      nameNode.textContent, {create:false},
      function(entry) {
        entry.remove(function() {
          parentNode.removeChild.bind(parentNode, li),
          this.reload();
        }.bind(this), error.bind(this, "remove:", entry));
      }.bind(this));
  }.bind(this));

  parentNode.appendChild(li);
};

Filer.prototype.showUsage = function() {
  if (this.isSyncable && chrome && chrome.syncFileSystem) {
    chrome.syncFileSystem.getUsageAndQuota(
      this.filesystem,
      function(info) {
        if (chrome.runtime.lastError) {
          error('getUsageAndQuota: ' + chrome.runtime.lastError.message);
          return;
        }
        $('#filer-usage').innerText =
            'Usage:' + this.formatSize(info.usageBytes);
      }.bind(this));
    return;
  }
  webkitStorageInfo.queryUsageAndQuota(
      this.filesystem,
      function(usage, quota) {
        $('#filer-usage').innerText =
            'Usage:' + this.formatSize(usage);
      }.bind(this));
};

Filer.prototype.formatSize = function(size) {
  var unit = 0;
  while (size > 1024 && unit < 5) {
    size /= 1024;
    unit++;
  }
  size = Math.floor(size);
  return size + ' ' + ['', 'K', 'M', 'G', 'T'][unit] + 'B';
};

Filer.prototype.setupDragAndDrop = function(elem) {
  elem.addEventListener('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
  }, false);
  elem.addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
    var items = e.dataTransfer.items;
    for (var i = 0; i < items.length; ++i) {
      if (items[i].kind != 'file') {
        log('Skipping non-file entry:' + items[i].kind);
        continue;
      }
      if (!items[i].webkitGetAsEntry) {
        error('Entries in drag-and-drop not supported in your browser.');
        break;
      }
      var entry = items[i].webkitGetAsEntry();
      if (!entry || !entry.isFile) {
        log('Skipping non-file entries:' + items[i].getAsFile().name);
        continue;
      }
      log('Copying file:' + entry.name);
      entry.copyTo(this.filesystem.root, entry.name, function(copied) {
        copied.file(function(file) {
          log('Copied file:' + copied.name);
          var node = this.getListNode('/');
          this.addEntry(node, copied, file);
        }.bind(this), error);
      }.bind(this), error);
    }
  }.bind(this), false);
}
