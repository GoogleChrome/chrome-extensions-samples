// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Constructor - no need to invoke directly, call initBackgroundPage instead.
 * @constructor
 * @param {String} url_request_token The OAuth request token URL.
 * @param {String} url_auth_token The OAuth authorize token URL.
 * @param {String} url_access_token The OAuth access token URL.
 * @param {String} consumer_key The OAuth consumer key.
 * @param {String} consumer_secret The OAuth consumer secret.
 * @param {String} oauth_scope The OAuth scope parameter.
 * @param {Object} opt_args Optional arguments.  Recognized parameters:
 *     "app_name" {String} Name of the current application
 *     "callback_page" {String} If you renamed chrome_ex_oauth.html, the name
 *          this file was renamed to.
 */
function ChromeExOAuth(url_request_token, url_auth_token, url_access_token,
                       consumer_key, consumer_secret, oauth_scope, opt_args) {
  this.url_request_token = url_request_token;
  this.url_auth_token = url_auth_token;
  this.url_access_token = url_access_token;
  this.consumer_key = consumer_key;
  this.consumer_secret = consumer_secret;
  this.oauth_scope = oauth_scope;
  this.app_name = opt_args && opt_args['app_name'] ||
      "ChromeExOAuth Library";
  this.key_token = "oauth_token";
  this.key_token_secret = "oauth_token_secret";
  this.callback_page = opt_args && opt_args['callback_page'] ||
      "chrome_ex_oauth.html";
  this.auth_params = {};
  if (opt_args && opt_args['auth_params']) {
    for (key in opt_args['auth_params']) {
      if (opt_args['auth_params'].hasOwnProperty(key)) {
        this.auth_params[key] = opt_args['auth_params'][key];
      }
    }
  }
};

/*******************************************************************************
 * PUBLIC API METHODS
 * Call these from your background page.
 ******************************************************************************/

/**
 * Initializes the OAuth helper from the background page.  You must call this
 * before attempting to make any OAuth calls.
 * @param {Object} oauth_config Configuration parameters in a JavaScript object.
 *     The following parameters are recognized:
 *         "request_url" {String} OAuth request token URL.
 *         "authorize_url" {String} OAuth authorize token URL.
 *         "access_url" {String} OAuth access token URL.
 *         "consumer_key" {String} OAuth consumer key.
 *         "consumer_secret" {String} OAuth consumer secret.
 *         "scope" {String} OAuth access scope.
 *         "app_name" {String} Application name.
 *         "auth_params" {Object} Additional parameters to pass to the
 *             Authorization token URL.  For an example, 'hd', 'hl', 'btmpl':
 *             http://code.google.com/apis/accounts/docs/OAuth_ref.html#GetAuth
 * @return {ChromeExOAuth} An initialized ChromeExOAuth object.
 */
ChromeExOAuth.initBackgroundPage = function(oauth_config) {
  window.chromeExOAuthConfig = oauth_config;
  window.chromeExOAuth = ChromeExOAuth.fromConfig(oauth_config);
  window.chromeExOAuthRedirectStarted = false;
  window.chromeExOAuthRequestingAccess = false;

  var url_match = chrome.extension.getURL(window.chromeExOAuth.callback_page);
  var tabs = {};
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url &&
        changeInfo.url.substr(0, url_match.length) === url_match &&
        changeInfo.url != tabs[tabId] &&
        window.chromeExOAuthRequestingAccess == false) {
      chrome.tabs.create({ 'url' : changeInfo.url }, function(tab) {
        tabs[tab.id] = tab.url;
        chrome.tabs.remove(tabId);
      });
    }
  });

  return window.chromeExOAuth;
};

/**
 * Authorizes the current user with the configued API.  You must call this
 * before calling sendSignedRequest.
 * @param {Function} callback A function to call once an access token has
 *     been obtained.  This callback will be passed the following arguments:
 *         token {String} The OAuth access token.
 *         secret {String} The OAuth access token secret.
 */
ChromeExOAuth.prototype.authorize = function(callback) {
  if (this.hasToken()) {
    callback(this.getToken(), this.getTokenSecret());
  } else {
    window.chromeExOAuthOnAuthorize = function(token, secret) {
      callback(token, secret);
    };
    chrome.tabs.create({ 'url' :chrome.extension.getURL(this.callback_page) });
  }
};

/**
 * Clears any OAuth tokens stored for this configuration.  Effectively a
 * "logout" of the configured OAuth API.
 */
ChromeExOAuth.prototype.clearTokens = function() {
  delete localStorage[this.key_token + encodeURI(this.oauth_scope)];
  delete localStorage[this.key_token_secret + encodeURI(this.oauth_scope)];
};

/**
 * Returns whether a token is currently stored for this configuration.
 * Effectively a check to see whether the current user is "logged in" to
 * the configured OAuth API.
 * @return {Boolean} True if an access token exists.
 */
ChromeExOAuth.prototype.hasToken = function() {
  return !!this.getToken();
};

/**
 * Makes an OAuth-signed HTTP request with the currently authorized tokens.
 * @param {String} url The URL to send the request to.  Querystring parameters
 *     should be omitted.
 * @param {Function} callback A function to be called once the request is
 *     completed.  This callback will be passed the following arguments:
 *         responseText {String} The text response.
 *         xhr {XMLHttpRequest} The XMLHttpRequest object which was used to
 *             send the request.  Useful if you need to check response status
 *             code, etc.
 * @param {Object} opt_params Additional parameters to configure the request.
 *     The following parameters are accepted:
 *         "method" {String} The HTTP method to use.  Defaults to "GET".
 *         "body" {String} A request body to send.  Defaults to null.
 *         "parameters" {Object} Query parameters to include in the request.
 *         "headers" {Object} Additional headers to include in the request.
 */
ChromeExOAuth.prototype.sendSignedRequest = function(url, callback,
                                                     opt_params) {
  var method = opt_params && opt_params['method'] || 'GET';
  var body = opt_params && opt_params['body'] || null;
  var params = opt_params && opt_params['parameters'] || {};
  var headers = opt_params && opt_params['headers'] || {};

  var signedUrl = this.signURL(url, method, params);

  ChromeExOAuth.sendRequest(method, signedUrl, headers, body, function (xhr) {
    if (xhr.readyState == 4) {
      callback(xhr.responseText, xhr);
    }
  });
};

/**
 * Adds the required OAuth parameters to the given url and returns the
 * result.  Useful if you need a signed url but don't want to make an XHR
 * request.
 * @param {String} method The http method to use.
 * @param {String} url The base url of the resource you are querying.
 * @param {Object} opt_params Query parameters to include in the request.
 * @return {String} The base url plus any query params plus any OAuth params.
 */
ChromeExOAuth.prototype.signURL = function(url, method, opt_params) {
  var token = this.getToken();
  var secret = this.getTokenSecret();
  if (!token || !secret) {
    throw new Error("No oauth token or token secret");
  }

  var params = opt_params || {};

  var result = OAuthSimple().sign({
    action : method,
    path : url,
    parameters : params,
    signatures: {
      consumer_key : this.consumer_key,
      shared_secret : this.consumer_secret,
      oauth_secret : secret,
      oauth_token: token
    }
  });

  return result.signed_url;
};

/**
 * Generates the Authorization header based on the oauth parameters.
 * @param {String} url The base url of the resource you are querying.
 * @param {Object} opt_params Query parameters to include in the request.
 * @return {String} An Authorization header containing the oauth_* params.
 */
ChromeExOAuth.prototype.getAuthorizationHeader = function(url, method,
                                                          opt_params) {
  var token = this.getToken();
  var secret = this.getTokenSecret();
  if (!token || !secret) {
    throw new Error("No oauth token or token secret");
  }

  var params = opt_params || {};

  return OAuthSimple().getHeaderString({
    action: method,
    path : url,
    parameters : params,
    signatures: {
      consumer_key : this.consumer_key,
      shared_secret : this.consumer_secret,
      oauth_secret : secret,
      oauth_token: token
    }
  });
};

/*******************************************************************************
 * PRIVATE API METHODS
 * Used by the library.  There should be no need to call these methods directly.
 ******************************************************************************/

/**
 * Creates a new ChromeExOAuth object from the supplied configuration object.
 * @param {Object} oauth_config Configuration parameters in a JavaScript object.
 *     The following parameters are recognized:
 *         "request_url" {String} OAuth request token URL.
 *         "authorize_url" {String} OAuth authorize token URL.
 *         "access_url" {String} OAuth access token URL.
 *         "consumer_key" {String} OAuth consumer key.
 *         "consumer_secret" {String} OAuth consumer secret.
 *         "scope" {String} OAuth access scope.
 *         "app_name" {String} Application name.
 *         "auth_params" {Object} Additional parameters to pass to the
 *             Authorization token URL.  For an example, 'hd', 'hl', 'btmpl':
 *             http://code.google.com/apis/accounts/docs/OAuth_ref.html#GetAuth
 * @return {ChromeExOAuth} An initialized ChromeExOAuth object.
 */
ChromeExOAuth.fromConfig = function(oauth_config) {
  return new ChromeExOAuth(
    oauth_config['request_url'],
    oauth_config['authorize_url'],
    oauth_config['access_url'],
    oauth_config['consumer_key'],
    oauth_config['consumer_secret'],
    oauth_config['scope'],
    {
      'app_name' : oauth_config['app_name'],
      'auth_params' : oauth_config['auth_params']
    }
  );
};

/**
 * Initializes chrome_ex_oauth.html and redirects the page if needed to start
 * the OAuth flow.  Once an access token is obtained, this function closes
 * chrome_ex_oauth.html.
 */
ChromeExOAuth.initCallbackPage = function() {
  var background_page = chrome.extension.getBackgroundPage();
  var oauth_config = background_page.chromeExOAuthConfig;
  var oauth = ChromeExOAuth.fromConfig(oauth_config);
  background_page.chromeExOAuthRedirectStarted = true;
  oauth.initOAuthFlow(function (token, secret) {
    background_page.chromeExOAuthOnAuthorize(token, secret);
    background_page.chromeExOAuthRedirectStarted = false;
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      chrome.tabs.remove(tabs[0].id);
    });
  });
};

/**
 * Sends an HTTP request.  Convenience wrapper for XMLHttpRequest calls.
 * @param {String} method The HTTP method to use.
 * @param {String} url The URL to send the request to.
 * @param {Object} headers Optional request headers in key/value format.
 * @param {String} body Optional body content.
 * @param {Function} callback Function to call when the XMLHttpRequest's
 *     ready state changes.  See documentation for XMLHttpRequest's
 *     onreadystatechange handler for more information.
 */
ChromeExOAuth.sendRequest = function(method, url, headers, body, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(data) {
    callback(xhr, data);
  }
  xhr.open(method, url, true);
  if (headers) {
    for (var header in headers) {
      if (headers.hasOwnProperty(header)) {
        xhr.setRequestHeader(header, headers[header]);
      }
    }
  }
  xhr.send(body);
};

/**
 * Decodes a URL-encoded string into key/value pairs.
 * @param {String} encoded An URL-encoded string.
 * @return {Object} An object representing the decoded key/value pairs found
 *     in the encoded string.
 */
ChromeExOAuth.formDecode = function(encoded) {
  var params = encoded.split("&");
  var decoded = {};
  for (var i = 0, param; param = params[i]; i++) {
    var keyval = param.split("=");
    if (keyval.length == 2) {
      var key = ChromeExOAuth.fromRfc3986(keyval[0]);
      var val = ChromeExOAuth.fromRfc3986(keyval[1]);
      decoded[key] = val;
    }
  }
  return decoded;
};

/**
 * Returns the current window's querystring decoded into key/value pairs.
 * @return {Object} A object representing any key/value pairs found in the
 *     current window's querystring.
 */
ChromeExOAuth.getQueryStringParams = function() {
  var urlparts = window.location.href.split("?");
  if (urlparts.length >= 2) {
    var querystring = urlparts.slice(1).join("?");
    return ChromeExOAuth.formDecode(querystring);
  }
  return {};
};

/**
 * Binds a function call to a specific object.  This function will also take
 * a variable number of additional arguments which will be prepended to the
 * arguments passed to the bound function when it is called.
 * @param {Function} func The function to bind.
 * @param {Object} obj The object to bind to the function's "this".
 * @return {Function} A closure that will call the bound function.
 */
ChromeExOAuth.bind = function(func, obj) {
  var newargs = Array.prototype.slice.call(arguments).slice(2);
  return function() {
    var combinedargs = newargs.concat(Array.prototype.slice.call(arguments));
    func.apply(obj, combinedargs);
  };
};

/**
 * Encodes a value according to the RFC3986 specification.
 * @param {String} val The string to encode.
 */
ChromeExOAuth.toRfc3986 = function(val){
   return encodeURIComponent(val)
       .replace(/\!/g, "%21")
       .replace(/\*/g, "%2A")
       .replace(/'/g, "%27")
       .replace(/\(/g, "%28")
       .replace(/\)/g, "%29");
};

/**
 * Decodes a string that has been encoded according to RFC3986.
 * @param {String} val The string to decode.
 */
ChromeExOAuth.fromRfc3986 = function(val){
  var tmp = val
      .replace(/%21/g, "!")
      .replace(/%2A/g, "*")
      .replace(/%27/g, "'")
      .replace(/%28/g, "(")
      .replace(/%29/g, ")");
   return decodeURIComponent(tmp);
};

/**
 * Adds a key/value parameter to the supplied URL.
 * @param {String} url An URL which may or may not contain querystring values.
 * @param {String} key A key
 * @param {String} value A value
 * @return {String} The URL with URL-encoded versions of the key and value
 *     appended, prefixing them with "&" or "?" as needed.
 */
ChromeExOAuth.addURLParam = function(url, key, value) {
  var sep = (url.indexOf('?') >= 0) ? "&" : "?";
  return url + sep +
         ChromeExOAuth.toRfc3986(key) + "=" + ChromeExOAuth.toRfc3986(value);
};

/**
 * Stores an OAuth token for the configured scope.
 * @param {String} token The token to store.
 */
ChromeExOAuth.prototype.setToken = function(token) {
  localStorage[this.key_token + encodeURI(this.oauth_scope)] = token;
};

/**
 * Retrieves any stored token for the configured scope.
 * @return {String} The stored token.
 */
ChromeExOAuth.prototype.getToken = function() {
  return localStorage[this.key_token + encodeURI(this.oauth_scope)];
};

/**
 * Stores an OAuth token secret for the configured scope.
 * @param {String} secret The secret to store.
 */
ChromeExOAuth.prototype.setTokenSecret = function(secret) {
  localStorage[this.key_token_secret + encodeURI(this.oauth_scope)] = secret;
};

/**
 * Retrieves any stored secret for the configured scope.
 * @return {String} The stored secret.
 */
ChromeExOAuth.prototype.getTokenSecret = function() {
  return localStorage[this.key_token_secret + encodeURI(this.oauth_scope)];
};

/**
 * Starts an OAuth authorization flow for the current page.  If a token exists,
 * no redirect is needed and the supplied callback is called immediately.
 * If this method detects that a redirect has finished, it grabs the
 * appropriate OAuth parameters from the URL and attempts to retrieve an
 * access token.  If no token exists and no redirect has happened, then
 * an access token is requested and the page is ultimately redirected.
 * @param {Function} callback The function to call once the flow has finished.
 *     This callback will be passed the following arguments:
 *         token {String} The OAuth access token.
 *         secret {String} The OAuth access token secret.
 */
ChromeExOAuth.prototype.initOAuthFlow = function(callback) {
  if (!this.hasToken()) {
    var params = ChromeExOAuth.getQueryStringParams();
    if (params['chromeexoauthcallback'] == 'true') {
      var oauth_token = params['oauth_token'];
      var oauth_verifier = params['oauth_verifier']
      this.getAccessToken(oauth_token, oauth_verifier, callback);
    } else {
      var request_params = {
        'url_callback_param' : 'chromeexoauthcallback'
      }
      this.getRequestToken(function(url) {
        window.location.href = url;
      }, request_params);
    }
  } else {
    callback(this.getToken(), this.getTokenSecret());
  }
};

/**
 * Requests an OAuth request token.
 * @param {Function} callback Function to call once the authorize URL is
 *     calculated.  This callback will be passed the following arguments:
 *         url {String} The URL the user must be redirected to in order to
 *             approve the token.
 * @param {Object} opt_args Optional arguments.  The following parameters
 *     are accepted:
 *         "url_callback" {String} The URL the OAuth provider will redirect to.
 *         "url_callback_param" {String} A parameter to include in the callback
 *             URL in order to indicate to this library that a redirect has
 *             taken place.
 */
ChromeExOAuth.prototype.getRequestToken = function(callback, opt_args) {
  if (typeof callback !== "function") {
    throw new Error("Specified callback must be a function.");
  }
  var url = opt_args && opt_args['url_callback'] ||
            window && window.top && window.top.location &&
            window.top.location.href;

  var url_param = opt_args && opt_args['url_callback_param'] ||
                  "chromeexoauthcallback";
  var url_callback = ChromeExOAuth.addURLParam(url, url_param, "true");

  var result = OAuthSimple().sign({
    path : this.url_request_token,
    parameters: {
      "xoauth_displayname" : this.app_name,
      "scope" : this.oauth_scope,
      "oauth_callback" : url_callback
    },
    signatures: {
      consumer_key : this.consumer_key,
      shared_secret : this.consumer_secret
    }
  });
  var onToken = ChromeExOAuth.bind(this.onRequestToken, this, callback);
  ChromeExOAuth.sendRequest("GET", result.signed_url, null, null, onToken);
};

/**
 * Called when a request token has been returned.  Stores the request token
 * secret for later use and sends the authorization url to the supplied
 * callback (for redirecting the user).
 * @param {Function} callback Function to call once the authorize URL is
 *     calculated.  This callback will be passed the following arguments:
 *         url {String} The URL the user must be redirected to in order to
 *             approve the token.
 * @param {XMLHttpRequest} xhr The XMLHttpRequest object used to fetch the
 *     request token.
 */
ChromeExOAuth.prototype.onRequestToken = function(callback, xhr) {
  if (xhr.readyState == 4) {
    if (xhr.status == 200) {
      var params = ChromeExOAuth.formDecode(xhr.responseText);
      var token = params['oauth_token'];
      this.setTokenSecret(params['oauth_token_secret']);
      var url = ChromeExOAuth.addURLParam(this.url_auth_token,
                                          "oauth_token", token);
      for (var key in this.auth_params) {
        if (this.auth_params.hasOwnProperty(key)) {
          url = ChromeExOAuth.addURLParam(url, key, this.auth_params[key]);
        }
      }
      callback(url);
    } else {
      throw new Error("Fetching request token failed. Status " + xhr.status);
    }
  }
};

/**
 * Requests an OAuth access token.
 * @param {String} oauth_token The OAuth request token.
 * @param {String} oauth_verifier The OAuth token verifier.
 * @param {Function} callback The function to call once the token is obtained.
 *     This callback will be passed the following arguments:
 *         token {String} The OAuth access token.
 *         secret {String} The OAuth access token secret.
 */
ChromeExOAuth.prototype.getAccessToken = function(oauth_token, oauth_verifier,
                                                  callback) {
  if (typeof callback !== "function") {
    throw new Error("Specified callback must be a function.");
  }
  var bg = chrome.extension.getBackgroundPage();
  if (bg.chromeExOAuthRequestingAccess == false) {
    bg.chromeExOAuthRequestingAccess = true;

    var result = OAuthSimple().sign({
      path : this.url_access_token,
      parameters: {
        "oauth_token" : oauth_token,
        "oauth_verifier" : oauth_verifier
      },
      signatures: {
        consumer_key : this.consumer_key,
        shared_secret : this.consumer_secret,
        oauth_secret : this.getTokenSecret(this.oauth_scope)
      }
    });

    var onToken = ChromeExOAuth.bind(this.onAccessToken, this, callback);
    ChromeExOAuth.sendRequest("GET", result.signed_url, null, null, onToken);
  }
};

/**
 * Called when an access token has been returned.  Stores the access token and
 * access token secret for later use and sends them to the supplied callback.
 * @param {Function} callback The function to call once the token is obtained.
 *     This callback will be passed the following arguments:
 *         token {String} The OAuth access token.
 *         secret {String} The OAuth access token secret.
 * @param {XMLHttpRequest} xhr The XMLHttpRequest object used to fetch the
 *     access token.
 */
ChromeExOAuth.prototype.onAccessToken = function(callback, xhr) {
  if (xhr.readyState == 4) {
    var bg = chrome.extension.getBackgroundPage();
    if (xhr.status == 200) {
      var params = ChromeExOAuth.formDecode(xhr.responseText);
      var token = params["oauth_token"];
      var secret = params["oauth_token_secret"];
      this.setToken(token);
      this.setTokenSecret(secret);
      bg.chromeExOAuthRequestingAccess = false;
      callback(token, secret);
    } else {
      bg.chromeExOAuthRequestingAccess = false;
      throw new Error("Fetching access token failed with status " + xhr.status);
    }
  }
};