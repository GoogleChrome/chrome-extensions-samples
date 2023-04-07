var webstore = (function() {
    
  function send(method, pathName, data, callback) {
    var token;
    var retry = true;

    getToken();

    function getToken() {
      chrome.identity.getAuthToken({ interactive: true }, function(authToken) {
        if (chrome.runtime.lastError) {
          callback(chrome.runtime.lastError);
          return;
        }

        token = authToken;
        start();
      });
    }

    function start() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, 'https://www.googleapis.com' + pathName);
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.responseType = 'json';
      xhr.onload = onLoad;
      xhr.send(data);
    }

    function onLoad() {
      if (this.status == 401 && retry) {
        retry = false;
	chrome.identity.removeCachedAuthToken({ token: token }, getToken);
      } else {
        callback(null, this.status, this.response);
      }
    }
  }
  
  function publish(itemId, callback) {
    send('POST', '/chromewebstore/v1.1/items/' + itemId + '/publish', null, callback);
  }
  
  function upload(itemId, data, callback) {
    var pathName = '/upload/chromewebstore/v1.1/items/';
    if (!itemId)
      send('POST', pathName, data, callback);
    else 
      send('PUT', pathName + itemId, data, callback);
  }
  
  return {
    publish: publish,
    upload: upload,
  }

})();
