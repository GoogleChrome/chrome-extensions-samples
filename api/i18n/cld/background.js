// Copyright (c) 2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var selectedId = -1;
function refreshLanguage() {
  chrome.tabs.detectLanguage(null, function(language) {
    console.log(language);
    if (language == " invalid_language_code")
      language = "???";
    chrome.browserAction.setBadgeText({"text": language, tabId: selectedId});
  });
}

chrome.tabs.onUpdated.addListener(function(tabId, props) {
  if (props.status == "complete" && tabId == selectedId)
    refreshLanguage();
});

chrome.tabs.onSelectionChanged.addListener(function(tabId, props) {
  selectedId = tabId;
  refreshLanguage();
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  selectedId = tabs[0].id;
  refreshLanguage();
});
