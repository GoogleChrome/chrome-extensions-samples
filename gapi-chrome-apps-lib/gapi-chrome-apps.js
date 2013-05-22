/**
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/**
 * gapi-chrome-apps version 0.001
 *
 * Provides the Google API javascript client 'gapi' as
 * appropriate for hosted websites, or if in a Chrome packaged
 * app implement a minimal set of functionality that is Content
 * Security Policy compliant and uses the chrome identity api.
 *
 * https://github.com/GoogleChrome/chrome-app-samples/tree/master/gapi-chrome-apps-lib
 *
 */
"use strict";

(function () {
  if (typeof gapi !== 'undefined')
    throw new Error('gapi already defined.');
  if (typeof gapiIsLoaded !== 'function')
    throw new Error('gapiIsLoaded callback function must be defined prior to ' +
                    'loading gapi-chrome-apps.js');

  // If not running in a chrome packaged app, load web gapi:
  if (!(chrome && chrome.app && chrome.app.runtime)) {
    // Load web gapi.
    var script = document.createElement('script');
    script.src = 'https://apis.google.com/js/client.js?onload=gapiIsLoaded';
    document.documentElement.appendChild(script);
    return;
  }

  window.gapi = {};
  gapi.auth = {};
  gapi.client = {};

  var access_token = undefined;

  gapi.auth.authorize = function (params, callback) {
    if (typeof callback !== 'function')
      throw new Error('callback required');

    var details = {}
    details.interactive = params.immediate === false || false;
    console.assert(!params.response_type || params.response_type == 'token')

    var callbackWrapper = function (getAuthTokenCallbackParam) {
      access_token = getAuthTokenCallbackParam;
      // TODO: error conditions?
      if (typeof access_token !== 'undefined')
        callback({ access_token: access_token});
      else
        callback();
    }

    chrome.identity.getAuthToken(details, callbackWrapper);
  };


  gapi.client.request = function (args) {
    if (typeof args !== 'object')
      throw new Error('args required');
    if (typeof args.callback !== 'function')
      throw new Error('callback required');
    if (typeof args.path !== 'string')
      throw new Error('path required');

    var path = 'https://www.googleapis.com' + args.path;
    if (typeof args.params === 'object') {
      var deliminator = '?';
      for (var i in args.params) {
        path += deliminator + encodeURIComponent(i) + "="
          + encodeURIComponent(args.params[i]);
        deliminator = '&';
      }
    }

    var xhr = new XMLHttpRequest();
    xhr.open(args.method || 'GET', path);
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    if (typeof args.body !== 'undefined') {
      xhr.setRequestHeader('content-type', 'application/json');
      xhr.send(JSON.stringify(args.body));
    } else {
      xhr.send();
    }

    xhr.onerror = function () {
      // TODO, error handling.
      debugger;
    };

    xhr.onload = function() {
      var rawResponseObject = {
        // TODO: body, headers.
        gapiRequest: {
          data: {
            status: this.status,
            statusText: this.statusText
          }
        }
      };

      var jsonResp = JSON.parse(this.response);
      var rawResp = JSON.stringify(rawResponseObject);
      args.callback(jsonResp, rawResp);
    };
  };

  // Call client handler when gapi is ready.
  setTimeout(function () { gapiIsLoaded(); }, 0);
})();
