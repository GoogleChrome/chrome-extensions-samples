// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let changeColor = document.getElementById('changeColor');

chrome.storage.sync.get('color', function (data) {
    changeColor.style.backgroundColor = data.color;
    changeColor.setAttribute('value', data.color);
});

changeColor.onclick = function (element) {
    let color = element.target.value;
    // The extension must query the active tab
    // before it can injected a content script
    // chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.scripting.executeScript(
            {
                target: {tabId: tabs[0].id},
                function: setColor
            }
        );
    // });
};

async function setColor() {
    let {color} = await chrome.storage.sync.get(['color']);
    document.body.style.backgroundColor = color;
};