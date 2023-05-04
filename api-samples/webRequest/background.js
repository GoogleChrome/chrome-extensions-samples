// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Alerts the user when an authorization request is requested via the console
chrome.webRequest.onAuthRequired.addListener((details, callbackFunction) => {
  console.log('An authorization request has been detected');
});
