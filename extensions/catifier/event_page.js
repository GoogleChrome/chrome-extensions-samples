// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Sample extension to replace all JPEG images (but no PNG/GIF/... images) with
// lolcat images from http://icanhascheezburger.com/ - except for images on
// Google.

var RequestMatcher = chrome.declarativeWebRequest.RequestMatcher;
var IgnoreRules = chrome.declarativeWebRequest.IgnoreRules;
var RedirectRequest = chrome.declarativeWebRequest.RedirectRequest;

var catImageUrl =
    'https://i.chzbgr.com/completestore/12/8/23/S__rxG9hIUK4sNuMdTIY9w2.jpg';

// Registers redirect rules assuming that currently no rules are registered by
// this extension, yet.
function registerRules() {
  var redirectRule = {
    priority: 100,
    conditions: [
      // If any of these conditions is fulfilled, the actions are executed.
      new RequestMatcher({
        // Both, the url and the resourceType must match.
        url: {pathSuffix: '.jpg'},
        resourceType: ['image']
      }),
      new RequestMatcher({
        url: {pathSuffix: '.jpeg'},
        resourceType: ['image']
      }),
    ],
    actions: [
      new RedirectRequest({redirectUrl: catImageUrl})
    ]
  };

  var exceptionRule = {
    priority: 1000,
    conditions: [
      // We use hostContains to compensate for various top-level domains.
      new RequestMatcher({url: {hostContains: '.google.'}})
    ],
    actions: [
      new IgnoreRules({lowerPriorityThan: 1000})
    ]
  };

  var callback = function() {
    if (chrome.runtime.lastError) {
      console.error('Error adding rules: ' + chrome.runtime.lastError);
    } else {
      console.info('Rules successfully installed');
      chrome.declarativeWebRequest.onRequest.getRules(null,
          function(rules) {
            console.info('Now the following rules are registered: ' +
                         JSON.stringify(rules, null, 2));
          });
    }
  };

  chrome.declarativeWebRequest.onRequest.addRules(
      [redirectRule, exceptionRule], callback);
}

function setup() {
  // This function is also called when the extension has been updated.  Because
  // registered rules are persisted beyond browser restarts, we remove
  // previously registered rules before registering new ones.
  chrome.declarativeWebRequest.onRequest.removeRules(
    null,
    function() {
      if (chrome.runtime.lastError) {
        console.error('Error clearing rules: ' + chrome.runtime.lastError);
      } else {
        registerRules();
      }
    });
}

// This is triggered when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(setup);
