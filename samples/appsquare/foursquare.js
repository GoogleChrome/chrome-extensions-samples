var foursquare = {};

(function(api) {
  // See "Pure AJAX application" from
  // https://developer.foursquare.com/overview/auth
  var ACCESS_TOKEN_PREFIX = '#access_token=';

  var storage = chrome.storage.local;
  var ACCESS_TOKEN_STORAGE_KEY = 'foursquare-access-token';

  var getAccessToken = function(callback) {
    storage.get(ACCESS_TOKEN_STORAGE_KEY, function(items) {
      callback(items[ACCESS_TOKEN_STORAGE_KEY]);
    });
  }

  var setAccessToken = function(accessToken, callback) {
    var items = {};
    items[ACCESS_TOKEN_STORAGE_KEY] = accessToken;
    storage.set(items, callback);
  }

  var clearAccessToken = function(callback) {
    storage.remove(ACCESS_TOKEN_STORAGE_KEY, callback);
  }

  // Tokens state is not exposed via the API
  api.isSignedIn = function(callback) {
    getAccessToken(function(accessToken) {
      callback(!!accessToken);
    });
  };
  api.signIn = function(appId, clientId, successCallback, errorCallback) {
    var redirectUrl = chrome.identity.getRedirectURL();
    var authUrl = 'https://foursquare.com/oauth2/authorize?' +
        'client_id=' + clientId + '&' +
        'response_type=token&' +
        'redirect_uri=' + encodeURIComponent(redirectUrl);
    chrome.identity.launchWebAuthFlow(
        {url: authUrl, interactive: true},
        function(responseUrl) {
        if (chrome.runtime.lastError) {
          errorCallback(chrome.runtime.lastError.message);
          return;
        }

        var accessTokenStart = responseUrl.indexOf(ACCESS_TOKEN_PREFIX);

        if (!accessTokenStart) {
          errorCallback('Unexpected responseUrl: ' + responseUrl);
          return;
        }

        var accessToken = responseUrl.substring(
            accessTokenStart + ACCESS_TOKEN_PREFIX.length);

        setAccessToken(accessToken, successCallback);
      });
  };
  api.signOut = function(callback) {
    clearAccessToken(callback);
  };

  var apiMethod = function(
      path, postData, params, successCallback, errorCallback) {
    getAccessToken(function(accessToken) {
      var xhr = new XMLHttpRequest();
      // TODO(mihaip): use xhr.responseType = 'json' once it's supported.
      xhr.onload = function() {
        successCallback(JSON.parse(xhr.responseText).response);
      }
      xhr.onerror = function() {
        errorCallback(xhr.status, xhr.statusText, JSON.parse(xhr.responseText));
      }

      var encodedParams = [];
      for (var paramName in params) {
        encodedParams.push(encodeURIComponent(paramName) + '=' +
            encodeURIComponent(params[paramName]));
      }
      xhr.open(
        'GET',
        'https://api.foursquare.com/v2/' + path + '?oauth_token=' +
            encodeURIComponent(accessToken) + '&' + encodedParams.join('&'),
        true);
      xhr.send(null);
    });
  }

  api.getRecentCheckins = apiMethod.bind(api, 'checkins/recent', undefined);
})(foursquare);
