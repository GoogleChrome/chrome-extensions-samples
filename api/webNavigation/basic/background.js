// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @filedescription Initializes the extension's background page.
 */

var nav = new NavigationCollector();

var eventList = ['onBeforeNavigate', 'onCreatedNavigationTarget',
    'onCommitted', 'onCompleted', 'onDOMContentLoaded',
    'onErrorOccurred', 'onReferenceFragmentUpdated', 'onTabReplaced',
    'onHistoryStateUpdated'];

eventList.forEach(function(e) {
  chrome.webNavigation[e].addListener(function(data) {
    if (typeof data)
      console.log(chrome.i18n.getMessage('inHandler'), e, data);
    else
      console.error(chrome.i18n.getMessage('inHandlerError'), e);
  });
});

// Reset the navigation state on startup. We only want to collect data within a
// session.
chrome.runtime.onStartup.addListener(function() {
  nav.resetDataStorage();
});
