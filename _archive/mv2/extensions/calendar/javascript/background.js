/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */

var warningId = 'notification.warning';

function hideWarning(done) {
  chrome.notifications.clear(warningId, function() {
    if (done) done();
  });
}

function showWarning() {
  hideWarning(function() {
    chrome.notifications.create(warningId, {
      iconUrl: chrome.runtime.getURL('images/icon-48.png'),
      title: 'Removal required',
      type: 'basic',
      message: chrome.i18n.getMessage('name') + ' is obsolete ' +
               'and must be removed. A replacement Extension ' +
               'is available.',
      buttons: [{ title: 'Learn More' }],
      priority: 2,
    }, function() {});
  });
}

function openWarningPage() {
  chrome.tabs.create({
    url: 'chrome://extensions?options=' + chrome.runtime.id
  });
}

chrome.browserAction.setBadgeBackgroundColor({ color: '#FF0000' });
chrome.browserAction.setBadgeText({ text: '!' });
chrome.browserAction.onClicked.addListener(openWarningPage);
chrome.notifications.onClicked.addListener(openWarningPage);
chrome.notifications.onButtonClicked.addListener(openWarningPage);
chrome.runtime.onInstalled.addListener(showWarning);
