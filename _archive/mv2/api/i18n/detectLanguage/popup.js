// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("btn-detect").addEventListener("click", function() {
    var inputText = document.getElementById("text").value;
    chrome.i18n.detectLanguage(inputText, function(result) {
        var languages =  "Languages: \n";
        for (var i = 0; i < result.languages.length; i++) {
           languages += result.languages[i].language + " ";
           languages += result.languages[i].percentage + "\n";
        }

        var is_reliable = "\nReliable? \n" + result.isReliable + "\n";
        alert(languages + is_reliable);
    });
  });
});
