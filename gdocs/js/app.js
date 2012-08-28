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

function upload(blob) {
  gdocs.upload(blob, function() {
    //...
  });
}

var dnd = new DnDFileController('body', function(files) {
  var files = files;
  Util.toArray(files).forEach(function(file, i) {
    upload(file);
  });
});

document.querySelector('#close-button').addEventListener('click', function(e) {
  self.close();
});

function DocsController($scope, $http) {
  $scope.docs = [];

  $scope.fetchDocs = function() {
    $scope.docs = []; // Clear out old results.

    var successCallback = function(resp, status, headers, config) {
      var docs = [];

      resp.feed.entry.forEach(function(entry, i) {
        var doc = {};

        doc.title = entry.title.$t;
        doc.updatedDate = Util.formatDate(entry.updated.$t);
        doc.updatedDateFull = entry.updated.$t;
        doc.icon = gdocs.getLink(entry.link,
            'http://schemas.google.com/docs/2007#icon').href;
        doc.alternateLink = gdocs.getLink(entry.link, 'alternate').href;

        doc.size = entry.docs$size ? '( ' + entry.docs$size.$t + ' bytes)' : null;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', doc.icon, true);
        xhr.responseType = 'blob';
        xhr.onload = function(e) {
          doc.icon = window.URL.createObjectURL(this.response);

          $scope.docs.push(doc);

          if (resp.feed.entry.length - 1 == i) {
            $scope.docs.sort(Util.sortByDate);
            $scope.$digest(); // Inform angular that we made changes.
          }
        };

        xhr.send();
      });
    };

    var config = {
      params: {'alt': 'json'},
      headers: {
        'Authorization': 'Bearer ' + gdocs.accessToken,
        'GData-Version': '3.0'
      }
    };

    $http.get(gdocs.DOCLIST_FEED, config).success(successCallback);
  };

  gdocs.auth(function() {
    // Noop. Just invoke this on ctor call.
    $scope.fetchDocs();
  });
}

DocsController.$inject = ['$scope', '$http'];


/*
document.querySelector('input[type="file"]').addEventListener('change', function(e) {
  var file = this.files[0]; // TODO: handle more than one file.
  upload(file);
});
*/
