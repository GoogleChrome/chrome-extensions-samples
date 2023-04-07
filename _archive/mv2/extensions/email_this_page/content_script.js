// Copyright (c) 2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var additionalInfo = {
  "title": document.title,
  "selection": window.getSelection().toString()
};

chrome.runtime.connect().postMessage(additionalInfo);
