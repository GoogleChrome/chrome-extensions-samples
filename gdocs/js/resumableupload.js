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

/* 
 * Implements the Google Docs resumable upload protocol.
 */
function ResumableUploader(initObj) {

  this.file = initObj.file;
  var contentType_ = initObj.file.type || 'application/octet-stream';
  var totalFileSize_ = initObj.file.size || initObj.fileSize;
  var chunkSize_ = initObj.chunkSize || this.DEFAULT_CHUNK_SIZE;
  var uploadUri_ = null;
  var token_ = initObj.accessToken;
  //var progressBar_ = initObj.progressBar || null;

  var commonHeaders_ = {
    'GData-Version': '3.0',
    'Authorization': 'Bearer ' + token_
  };

  var init_ = new function() {  // Self-executing function expression.

    // Convenience to set a bunch of headers. Sticking here so this is not
    // available on xhr until the library is actually used :)
    XMLHttpRequest.prototype.setRequestHeaders = function(headers) {
      for (var key in headers) {
        this.setRequestHeader(key, headers[key]);
      }
    };
  
    // Send the entire file if the chunk size is less than file's total size.
    if (totalFileSize_ <= chunkSize_) {
      chunkSize_ = totalFileSize_;
    }
  };

  this.initSession = function(sessionObj, callback) {
    var url = sessionObj.resumableMediaLink;
    var entry = sessionObj.entry || null;
    var headers = sessionObj.headers || {};

    var xhr = new XMLHttpRequest();

    xhr.onload = function(e) {
      if (this.status == 200) {
        uploadUri_ = this.getResponseHeader('Location');
        callback(uploadUri_);
      } else {
        throw new Error('Error: HTTP ' + this.status + ' returned');
      }
    };

    if (!entry) {
      entry = "<?xml version='1.0' encoding='UTF-8'?>\
          <entry xmlns='http://www.w3.org/2005/Atom' xmlns:docs='http://schemas.google.com/docs/2007'>\
            <title>" + this.file.name + "</title>\
          </entry>";
    }

    headers = Util.merge(commonHeaders_, Util.merge({
      'X-Upload-Content-Type': contentType_,
      'X-Upload-Content-Length': totalFileSize_,
      'Content-Type': 'application/atom+xml'
    }, headers));

    xhr.open('POST', url);
    xhr.setRequestHeaders(headers);
    xhr.send(entry);
  };

  this.uploadChunk = function(startByte, fileChunk, onComplete) {
    if (!uploadUri_) {
      throw new Error('Resumable upload request not initialized.');
    }

    // Adjustment if last byte range is less than defined chunk size.
    var chunkSize = chunkSize_;
    if (fileChunk.size <= chunkSize) {
      chunkSize = fileChunk.size;
    }

    var xhr = new XMLHttpRequest();

/*
    // FF needs to set event before xhr.open.
    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        var percentComplete = (e.loaded / e.total) * 100;
        if (progressBar_) {
          progressBar_.value = percentComplete;
        }
      }
    };
*/

    xhr.onload = function(e) {
      if (this.status == 201) {  // Done. <entry> created on server.
        onComplete(this.response);
      } else if (this.status != 308) {
        throw new Error('Error: HTTP ' + this.status + ' returned');
      }
    };

    var headers = {
      'Content-Type': contentType_,
      'Content-Range': Util.format('bytes {0}-{1}/{2}', startByte,
                                   startByte + chunkSize - 1, totalFileSize_)
    };

console.log(headers['Content-Range']);

    // These chunks need to be uploaded in the proper order. Async XHR will fudge that.
    xhr.open('PUT', uploadUri_, true);
    xhr.setRequestHeaders(Util.merge(commonHeaders_, headers));
    xhr.send(fileChunk);
  };

  this.uploadFile = function(initObj, callback) {

    this.initSession(initObj, function(location) {
      var startByte = 0

      while (startByte < totalFileSize_) {

console.log(startByte, startByte + chunkSize_);

        var chunk = this.file.slice(
            startByte, startByte + chunkSize_, this.file.type);

console.log(chunk, chunk.size);

        this.uploadChunk(startByte, chunk, callback);
        startByte += chunkSize_;
      }
    }.bind(this));
  };

}

ResumableUploader.prototype.DEFAULT_CHUNK_SIZE = 1024 * 1024 * 5; // 5MB
