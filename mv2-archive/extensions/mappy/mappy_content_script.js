// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Search the text nodes for a US-style mailing address.

let findAddress = function() {
  let found;
  let re = /(\d+\s+[':.,\s\w]*,\s*[A-Za-z]+\s*\d{5}(-\d{4})?)/m;
  let node = document.body.textContent.match(re);
  if (document.body.textContent.match(re)) {
    found = node;
  }
  if (found) {
    let text = node;
    let match = re.exec(text);
    if (match && match.length) {
      console.log('found: ' + match[0]);
      let trim = /\s{2,}/g;
      let address = match[0].replace(trim, ' ')
      chrome.runtime.sendMessage({'address': address})
    } else {
      console.log('bad initial match: ' + found.textContent);
      console.log('no match in: ' + text);
    }
  }
}

findAddress();
