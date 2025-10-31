// Copyright 2024 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Listen for download changes
chrome.downloads.onChanged.addListener((downloadDelta) => {
  console.log('Download changed:', downloadDelta);
  
  // Check if download completed
  if (downloadDelta.state && downloadDelta.state.current === 'complete') {
    console.log(`Download ${downloadDelta.id} completed`);
  }
  
  // Check if download was interrupted
  if (downloadDelta.state && downloadDelta.state.current === 'interrupted') {
    console.log(`Download ${downloadDelta.id} was interrupted`);
  }
});

// Listen for new downloads
chrome.downloads.onCreated.addListener((downloadItem) => {
  console.log('New download started:', downloadItem);
});

// Listen for downloads being erased from history
chrome.downloads.onErased.addListener((downloadId) => {
  console.log('Download erased from history:', downloadId);
});
