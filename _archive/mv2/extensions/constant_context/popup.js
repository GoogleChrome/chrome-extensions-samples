// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function displayWords() {
  chrome.storage.local.get(['words'], function(object) {
    let pageList = document.getElementById('displayWords');
    if (object.words) {
      searchWords = object.words
      for (var i = 0; i < searchWords.length; i++){
        let listItem = document.createElement('li');
        listItem.innerText = searchWords[i]
        pageList.appendChild(listItem);
      }
    }
  });
}

displayWords();

document.getElementById('wordSubmit').onclick = function() {
  let userWords = document.getElementById('userWords').value.trim();
  chrome.storage.local.get(['words'], function(object) {
    let newWords = object.words || [];
    newWords.push(userWords);
    chrome.storage.local.set({words: newWords});
  })
  chrome.tabs.executeScript(null, {
    file: 'content_script.js'
  });
}

document.getElementById('clearList').onclick = function() {
  chrome.storage.local.clear();
}
