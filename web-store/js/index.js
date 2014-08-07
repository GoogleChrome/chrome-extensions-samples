function updateIdInput(button, itemId) {
  var input = button.parentNode.querySelector('input');
  input.value = itemId;
  updateVisibleButtons(input);
}

function updateVisibleButtons(input) {
  var enabled = (input.value && input.value.length === 32);
  var webStoreLink = input.parentNode.querySelector('.webstore-link');
  input.parentNode.querySelector('.publish').disabled = !enabled; 
  if (enabled)
    webStoreLink.classList.remove('disabled');
  else
    webStoreLink.classList.add('disabled');
}

function setSuccessButton(button) {
  button.textContent = 'success';
  button.classList.add('success');
}

function setFailureButton(button) {
  button.textContent = 'failure';
  button.classList.add('failure');
}

function resetButton(button) {
  setTimeout(function() {
    button.classList.remove('success', 'failure');
    if (button.classList.contains('publish'))
      button.textContent = 'publish';
    else if (button.classList.contains('upload'))
      button.textContent = 'upload';
  }, 2000);
}

function onWebStoreLinkClicked() {
  var input = this.parentNode.querySelector('input');
  var url = 'https://chrome.google.com/webstore/developer/edit/' + input.value;
  window.open(url);
}

var console = document.querySelector('#console');
function showError(response) {
  console.textContent = JSON.stringify(response, null, 2);
  console.classList.remove('hidden');
  setTimeout(function() {
    console.classList.add('hidden');
  }, 5000);
}

// Handles click on Upload button.
function onUploadButtonClicked() {
  var directoryEntryId = this.parentNode.dataset.directoryEntryId;
  var itemId = this.parentNode.querySelector('input').value;

  var button = this;
  button.classList.add('working');
  button.textContent = 'packing';
  chrome.fileSystem.restoreEntry(directoryEntryId, function(directoryEntry) {
    var directories = [];
    var files = [];
    var reader = directoryEntry.createReader();

    function scan(entries) {
      // when the size of the entries array is 0, we've processed all the
      // directory contents
      if (entries.length == 0) {
        if (directories.length > 0) {
          reader = directories.shift().createReader();
          reader.readEntries(scan);
        } else {
          zip.workerScriptsPath = chrome.runtime.getURL('js/zip/');
          zip.createWriter(new zip.BlobWriter('application/zip'),
              function(zipWriter) {

            (function writeToZip(index) {
              if (index == files.length) {
                zipWriter.close(function(blob) {
                  button.textContent = 'uploading';
                  webstore.upload(itemId, blob, function(error, status, response) {
                    button.classList.remove('working');
                    if (response.uploadState === 'SUCCESS') {
                      setSuccessButton(button);
                      updateIdInput(button, response.id);
                    } else {
                      setFailureButton(button);
                      showError(error || response);
                    }
                    resetButton(button);
                  });
                });
                return;
              }
              var entry = files[index];
              entry.file(function(file) {
                zipWriter.add(entry.fullPath, new zip.BlobReader(file),
                    function() {
                  writeToZip(++index);
                });
              });
            })(0);
          });
        }
        return;
      }
      for (var i = 0; i < entries.length; i++) {
         if (entries[i].isDirectory) {
           // Skip .git folder.
           if (entries[i].name !== '.git')
             directories.push(entries[i]);
         } else {
           files.push(entries[i]);
         }
      }
      // readEntries has to be called until it returns an empty array.
      // According to the spec, the function might not return all of the
      // directory's contents during a given call.
      reader.readEntries(scan);
    }
    reader.readEntries(scan);
  });
}

// Handles click on Publish button.
function onPublishButtonClicked() {
  var button = this;
  var directoryEntryId = button.parentNode.dataset.directoryEntryId;
  var itemId = button.parentNode.querySelector('input').value;

  if (!itemId)
    return;
         
  // Save item Id before publishing to the webstore.
  var id = {};
  id[directoryEntryId] = itemId; 
  chrome.storage.local.set(id, function() {  
    button.classList.add('working');
    button.textContent = 'uploading';
    webstore.publish(itemId, function(error, status, response) {
      button.classList.remove('working');
      if (response.status && response.status[0] === 'OK') {
        setSuccessButton(button);
      } else {
        setFailureButton(button);
        showError(error || response);
      }
      resetButton(button);
    });
  });
}

// Get Project 128x128 icon Data URL defined in manifest.
function getProjectIcon(directoryEntry, manifest, callback) {
  // If it doesn't exist, return a default image URL.
  if (!manifest.icons || !manifest.icons[128]) {
    callback(chrome.runtime.getURL('images/extension_icon.png'));
    return;
  }
  directoryEntry.getFile(manifest.icons[128], {}, function(fileEntry) {
    fileEntry.file(function(file) {
      var reader = new FileReader();
      reader.onloadend = function() {
        callback(this.result);
      };
      reader.readAsDataURL(file);
    });
  });
}

// Get Project manifest from directory Entry.
function getProjectManifest(directoryEntry, callback) {
  directoryEntry.getFile('manifest.json', {}, function(fileEntry) {
    fileEntry.file(function(file) {
      var reader = new FileReader();
      reader.onloadend = function() {
        try {
          var manifest = JSON.parse(this.result);
          callback(manifest);          
        } catch(e) {
          console.error(e);
        }
      };
      reader.readAsText(file);
    });
  });
}

var projectsContainer = document.querySelector('#projects');
// Create project div.
function createProjectDiv(directoryEntry, directoryEntryId, callback) {
  getProjectManifest(directoryEntry, function(manifest) {
    getProjectIcon(directoryEntry, manifest, function(iconUrl) {
      var projectDiv = document.createElement('div');
      projectDiv.classList.add('project');
      projectDiv.dataset.directoryEntryId = directoryEntryId;
      projectDiv.style.backgroundImage = 'url(' + iconUrl + ')';

      var title = document.createElement('div');
      title.classList.add('title');
      title.textContent = manifest.name;
      projectDiv.appendChild(title);

      var webstoreLink = document.createElement('div');
      webstoreLink.classList.add('webstore-link');
      webstoreLink.textContent = 'Web Store';
      webstoreLink.addEventListener('click', onWebStoreLinkClicked);
      projectDiv.appendChild(webstoreLink);

      var path = document.createElement('div');
      path.classList.add('path');
      chrome.fileSystem.getDisplayPath(directoryEntry,
          function(displayPath) {
        path.textContent = displayPath;
      });
      projectDiv.appendChild(path);

      var idInput = document.createElement('input');
      idInput.placeholder = 'Enter ID or leave empty';
      idInput.addEventListener('input', function() {
          updateVisibleButtons(this);
      });
      chrome.storage.local.get(directoryEntryId, function(results) {
        var id = results[directoryEntryId];
        idInput.value = id || '';        
        updateVisibleButtons(idInput);
      });
      projectDiv.appendChild(idInput);

      var publishButton = document.createElement('button');
      publishButton.textContent = 'Publish';
      publishButton.classList.add('publish');
      publishButton.addEventListener('click', onPublishButtonClicked);
      projectDiv.appendChild(publishButton);

      var uploadButton = document.createElement('button');
      uploadButton.textContent = 'Upload';
      uploadButton.classList.add('upload');
      uploadButton.addEventListener('click', onUploadButtonClicked);
      projectDiv.appendChild(uploadButton);
      
      projectsContainer.insertBefore(projectDiv, projectsContainer.firstChild);
      callback();
    });
  });
}

// Insert project backed up by its retained entry Id.
function insertProject(directoryEntryId, callback) {
  chrome.fileSystem.restoreEntry(directoryEntryId, function(directoryEntry) {
    if (chrome.runtime.lastError)
      return;
    createProjectDiv(directoryEntry, directoryEntryId, callback);
  });
}

var addProjectButton = document.querySelector('#add-project');
// Open directory picker.
addProjectButton.addEventListener('click', function() {
  chrome.fileSystem.chooseEntry({ type: 'openDirectory' },
      function(directoryEntry) {
    if (!directoryEntry)
      return;
    // Retain directory entry id.
    var directoryEntryId = chrome.fileSystem.retainEntry(directoryEntry);
    insertProject(directoryEntryId, function() {      
      getDirectoryEntryIds(function(directoryEntryIds) {
        directoryEntryIds.splice(0, 0, directoryEntryId);
	chrome.storage.local.set({'directoryEntryIds' : directoryEntryIds });
      });
    });
  });
});

// Get retained directory entry Ids from local storage.
function getDirectoryEntryIds(callback) {
  chrome.storage.local.get('directoryEntryIds', function(results) {
    var directoryEntryIds = results.directoryEntryIds || [];
    callback(directoryEntryIds);
  });
}

// Restore retained directories on load.
getDirectoryEntryIds(function(directoryEntryIds) {
  var i = directoryEntryIds.length - 1;
  if (i < 0)
    return;
  insertProject(directoryEntryIds[i], function callback() {
    if (--i >= 0)
      insertProject(directoryEntryIds[i], callback);
  });
});
