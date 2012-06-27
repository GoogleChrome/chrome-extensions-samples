var gdocs = new GDocs();

function log(msg) {
  var frag = document.createDocumentFragment();
  frag.textContent = msg;
  document.querySelector('#log').appendChild(frag);
}

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
          doc.icon = window.webkitURL.createObjectURL(this.response);

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