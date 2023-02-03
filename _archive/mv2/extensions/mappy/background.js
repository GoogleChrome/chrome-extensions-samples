// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict'

chrome.runtime.onMessage.addListener(function(req, sender) {
  chrome.storage.local.set({address: req.address})
  chrome.pageAction.show(sender.tab.id);
  chrome.pageAction.setTitle({tabId: sender.tab.id, title: req.address});
});
