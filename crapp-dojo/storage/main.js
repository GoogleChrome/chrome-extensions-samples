var BIG_FILE = 30 * 1024 * 1024;

function log(message) {
  document.getElementById('log').textContent += message + '\n';
}

onload = function() {
  document.getElementById('request-quota').onclick = function() {
    window.webkitStorageInfo.requestQuota(
        window.PERSISTENT,
        BIG_FILE,
        function(grantedBytes) { log('Granted ' + grantedBytes) },
        function(e) { log('Error: ' + e); });
  };

  document.getElementById('query-quota').onclick = function() {
    window.webkitStorageInfo.queryUsageAndQuota(
        window.PERSISTENT,
        function(usage, quota) { log('usage ' + usage + ' quota ' + quota) },
        function(e) { log('Error: ' + e); });
  };

  document.getElementById('request-filesystem').onclick = function() {
    window.webkitRequestFileSystem(
        PERSISTENT,
        BIG_FILE,
        function(fs) {
            log('Filesystem: ' + fs);

            fs.root.getFile(
                'test.txt',
                {create: true, exclusive: true},
                function(fileEntry) {
                  log('fileEntry: ' + fileEntry);
                  fileEntry.createWriter(function(fileWriter) {
                    log('fileWriter: ' + fileWriter);
                    fileWriter.onwriteend = function(e) {
                      log('Write completed.');
                    };

                    fileWriter.onerror = function(e) {
                      log('Write failed: ' + e.toString());
                    };

                  var bb = new WebKitBlobBuilder(); // Note: window.WebKitBlobBuilder in Chrome 12.
                  for (var i = 0; i < BIG_FILE/50; i++) {
                    bb.append('01234567890123456789012345678901234567890123456789');
                  }
                  fileWriter.write(bb.getBlob('text/plain'));
                }, function(e) {
                  log('Error: ' + e);
                });
              });
        },
        function(e) {log('Error' + e);});
  };
}

