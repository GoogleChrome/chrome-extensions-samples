// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function setChildTextNode(elementId, text) {
  document.getElementById(elementId).innerText = text;
}

function init() {
  setChildTextNode('languageSpan', chrome.i18n.getMessage("click_here"));
}

function getAcceptLanguages() {
  chrome.i18n.getAcceptLanguages(function(languageList) {
    var languages = languageList.join(",");
    setChildTextNode('languageSpan',
        chrome.i18n.getMessage("chrome_accept_languages", languages));
  })
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('#accept_lang').addEventListener(
      'click', getAcceptLanguages);
  init();
});
