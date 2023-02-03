// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var requestButton = document.getElementById("requestButton");
var scanButton = document.getElementById('scanButton');
var scannedImages = document.getElementById('scannedImages');
var waitAnimation = document.getElementById('waitAnimation');
var imageMimeType;

function setOnlyChild(parent, child) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
  parent.appendChild(child);
}

var gotPermission = function(result) {
  waitAnimation.style.display = 'block';
  requestButton.style.display = 'none';
  scanButton.style.display = 'block';
  console.log('App was granted the "documentScan" permission.');
  waitAnimation.style.display = 'none';
};

var permissionObj = {permissions: ['documentScan']};

requestButton.addEventListener('click', function() {
  waitAnimation.style.display = 'block';
  chrome.permissions.request( permissionObj, function(result) {
    if (result) {
      gotPermission();
    } else {
      console.log('App was not granted the "documentScan" permission.');
      console.log(chrome.runtime.lastError);
    }
  });
});

var onScanCompleted = function(scan_results) {
  waitAnimation.style.display = 'none';
  if (chrome.runtime.lastError) {
    console.log('Scan failed: ' + chrome.runtime.lastError.message);
    return;
  }
  numImages = scan_results.dataUrls.length;
  console.log('Scan completed with ' + numImages + ' images.');
  for (var i = 0; i < numImages; i++) {
    urlData = scan_results.dataUrls[i]
    console.log('Scan ' + i + ' data length ' +
                urlData.length + '.');
    console.log('URL is ' + urlData);
    var scannedImage = document.createElement('img');
    scannedImage.src = urlData;
    scannedImages.insertBefore(scannedImage, scannedImages.firstChild);
  }
};

scanButton.addEventListener('click', function() {
  var scanProperties = {};
  waitAnimation.style.display = 'block';
  chrome.documentScan.scan(scanProperties, onScanCompleted);
});

chrome.permissions.contains(permissionObj, function(result) {
  if (result) {
    gotPermission();
  }
});
