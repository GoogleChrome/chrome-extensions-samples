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

Author: Eric Bidelman (ericbidelman@chromium.org)
*/

var gdocs = new GDocs();

// FILESYSTEM SUPPORT ----------------------------------------------------------
var fs = null;
var FOLDERNAME = 'test';

function writeFile(blob) {
  if (!fs) {
    return;
  }

  fs.root.getDirectory(FOLDERNAME, {create: true}, function(dirEntry) {
    dirEntry.getFile(blob.name, {create: true, exclusive: false}, function(fileEntry) {
      // Create a FileWriter object for our FileEntry, and write out blob.
      fileEntry.createWriter(function(fileWriter) {
        fileWriter.onerror = onError;
        fileWriter.onwriteend = function(e) {
          console.log('Write completed.');
        };
        fileWriter.write(blob);
      }, onError);
    }, onError);
  }, onError);
}
// -----------------------------------------------------------------------------

function upload(blob) {
  gdocs.upload(blob, function() {
    console.log('Upload complete');
  });
}

function onError(e) {
  console.log(e);
}

// Main Angular controller for app.
function DocsController($scope, $http) {
  $scope.docs = [];

  $scope.fetchDocs = function() {
    $scope.docs = []; // Clear out old results.

    var onResponse = function(doc, i, totalEntries, opt_inform) {
      var inform = opt_inform || false;

      $scope.docs.push(doc);

      // Only want to sort and call $apply() when we have all entries.
      if (totalEntries - 1 == i) {
        $scope.docs.sort(Util.sortByDate);
        if (inform) {
          $scope.$apply(); // Inform angular that we made changes.
        }
      }
    };


    // Response handler that caches file icons int he filesystem API.
    var successCallbackWithFsCaching = function(resp, status, headers, config) {
      var docs = [];

      var totalEntries = resp.feed.entry.length;

      resp.feed.entry.forEach(function(entry, i) {
        var doc = {
          title: entry.title.$t,
          updatedDate: Util.formatDate(entry.updated.$t),
          updatedDateFull: entry.updated.$t,
          icon: gdocs.getLink(entry.link,
                              'http://schemas.google.com/docs/2007#icon').href,
          alternateLink: gdocs.getLink(entry.link, 'alternate').href,
          size: entry.docs$size ? '( ' + entry.docs$size.$t + ' bytes)' : null
        };

        // 'http://gstatic.google.com/doc_icon_128.png' -> 'doc_icon_128.png'
        doc.iconFilename = doc.icon.substring(doc.icon.lastIndexOf('/') + 1);

        // If file exists, it we'll get back a FileEntry for the filesystem URL.
        // Otherwise, the error callback will fire and we need to XHR it in and
        // write it to the FS.
        var fsURL = fs.root.toURL() + FOLDERNAME + '/' + doc.iconFilename;
        window.webkitResolveLocalFileSystemURL(fsURL, function(entry) {
          console.log('Fetched icon from the FS cache');

          doc.icon = entry.toURL(); // should be === to fsURL, but whatevs.

          onResponse(doc, i, totalEntries, true);
        }, function(e) {

          $http.get(doc.icon, {responseType: 'blob'}).success(function(blob) {
            console.log('Fetched icon via XHR');

            blob.name = doc.iconFilename; // Add icon filename to blob.

            writeFile(blob); // Write is async, but that's ok.

            doc.icon = window.URL.createObjectURL(blob);

            onResponse(doc, i, totalEntries);
          });

        });
      });
    };

    var config = {
      params: {'alt': 'json'},
      headers: {
        'Authorization': 'Bearer ' + gdocs.accessToken,
        'GData-Version': '3.0'
      }
    };

    $http.get(gdocs.DOCLIST_FEED, config).success(successCallbackWithFsCaching);
  };

  gdocs.auth(function() {
    // Noop. Just invoke this on ctor call.
    $scope.fetchDocs();
  });
}

DocsController.$inject = ['$scope', '$http'];

// Init setup and attach event listeners.
document.addEventListener('DOMContentLoaded', function(e) {
  var dnd = new DnDFileController('body', function(files) {
    Util.toArray(files).forEach(function(file, i) {
      upload(file);
    });
  });

  // var input = document.querySelector('input[type="file"]');
  // input.addEventListener('change', function(e) {
  //   var file = this.files[0]; // TODO: handle more than one file.
  //   upload(file);
  // });

  var closeButton = document.querySelector('#close-button');
  closeButton.addEventListener('click', function(e) {
    window.close();
  });

  // FILESYSTEM SUPPORT --------------------------------------------------------
  window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function(localFs) {
    fs = localFs;
  }, onError);
  // ---------------------------------------------------------------------------
});
