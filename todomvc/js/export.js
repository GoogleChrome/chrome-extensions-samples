(function() {

  var dbName = 'todos-vanillajs';

  var fileSystem;

  var savedFileEntry, fileDisplayPath;

  function getTodosAsText(callback) {
    chrome.storage.local.get(dbName, function(storedData) {
      var text = '';

      if ( storedData[dbName].todos ) {
        storedData[dbName].todos.forEach(function(todo) {
            text += '- ';
            if ( todo.completed ) {
              text += '[DONE] ';
            }
            text += todo.title;
            text += '\n';
          }, '');
      }

      callback(text);

    }.bind(this));
  }

  // Given a FileEntry,
  function exportToFileEntry(fileEntry) {
    savedFileEntry = fileEntry;

    var status = document.getElementById('status'),
        fileDisplayPath = fileEntry.fullPath;

    status.innerText = 'Exporting to '+fileDisplayPath;

    getTodosAsText( function(contents) {

      fileEntry.createWriter(function(fileWriter) {

        fileWriter.onwriteend = function(e) {
          status.innerText = 'Export to '+
               fileDisplayPath+' completed';
          // You need to explicitly set the file size to truncate
          // any content that could be there before
          this.onwriteend = null;
          this.truncate(e.total);
        };

        fileWriter.onerror = function(e) {
          status.innerText = 'Export failed: '+e.toString();
        };

        var blob = new Blob([contents]);
        fileWriter.write(blob);

      });
    });

  }

  function exportToFileSystem(fs) {
    if (fs) {
      fileSystem = fs;
    }

    fs.root.getFile('todomvc.txt', {create: true}, exportToFileEntry);

  }

  function doExportToDisk() {

    if (fileSystem) {
      exportToFileSystem(fileSystem);
    }
      
    chrome.syncFileSystem.requestFileSystem( exportToFileSystem );

  }

 document.getElementById('exportToDisk').
   addEventListener('click', doExportToDisk);

})()
