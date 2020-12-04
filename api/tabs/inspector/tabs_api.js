// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

tabs = {};
tabIds = [];

focusedWindowId = undefined;
currentWindowId = undefined;

function bootStrap() {
  chrome.windows.getCurrent(function(currentWindow) {
    currentWindowId = currentWindow.id;
    chrome.windows.getLastFocused(function(focusedWindow) {
      focusedWindowId = focusedWindow.id;
      loadWindowList();
    });
  });
}

function isInt(i) {
  return (typeof i == "number") && !(i % 1) && !isNaN(i);
}

function loadWindowList() {
  chrome.windows.getAll({ populate: true }, function(windowList) {
    tabs = {};
    tabIds = [];
    for (var i = 0; i < windowList.length; i++) {
      windowList[i].current = (windowList[i].id == currentWindowId);
      windowList[i].focused = (windowList[i].id == focusedWindowId);

      for (var j = 0; j < windowList[i].tabs.length; j++) {
        tabIds[tabIds.length] = windowList[i].tabs[j].id;
        tabs[windowList[i].tabs[j].id] = windowList[i].tabs[j];
      }
    }

    var input = new JsExprContext(windowList);
    var output = document.getElementById('windowList');
    jstProcess(input, output);
  });
}

function updateTabData(id) {
  var retval = {
    url: document.getElementById('url_' + id).value,
    selected: document.getElementById('selected_' + id).value ? true : false
  }

  return retval;
}

function updateTab(id){
  try {
    chrome.tabs.update(id, updateTabData(id));
  } catch (e) {
    alert(e);
  }
}

function moveTabData(id) {
  return {
    'index': parseInt(document.getElementById('index_' + id).value),
    'windowId': parseInt(document.getElementById('windowId_' + id).value)
  }
}
function moveTab(id) {
  try {
    chrome.tabs.move(id, moveTabData(id));
  } catch (e) {
    alert(e);
  }
}

function createTabData(id) {
  return {
    'index': parseInt(document.getElementById('index_' + id).value),
    'windowId': parseInt(document.getElementById('windowId_' + id).value),
    'index': parseInt(document.getElementById('index_' + id).value),
    'url': document.getElementById('url_' + id).value,
    'selected': document.getElementById('selected_' + id).value ? true : false
  }
}

function createTab() {
  var args = createTabData('new')

  if (!isInt(args.windowId))
    delete args.windowId;
  if (!isInt(args.index))
    delete args.index;

  try {
    chrome.tabs.create(args);
  } catch (e) {
    alert(e);
  }
}

function updateAll() {
  try {
    for (var i = 0; i < tabIds.length; i++) {
      chrome.tabs.update(tabIds[i], updateTabData(tabIds[i]));
    }
  } catch(e) {
    alert(e);
  }
}

function moveAll() {
  appendToLog('moving all');
  try {
    for (var i = 0; i < tabIds.length; i++) {
      chrome.tabs.move(tabIds[i], moveTabData(tabIds[i]));
    }
  } catch(e) {
    alert(e);
  }
}

function removeTab(tabId) {
  try {
    chrome.tabs.remove(tabId, function() {
      appendToLog('tab: ' + tabId + ' removed.');
    });
  } catch (e) {
    alert(e);
  }
}

function appendToLog(logLine) {
  document.getElementById('log')
      .appendChild(document.createElement('div'))
      .innerText = "> " + logLine;
}

function clearLog() {
  document.getElementById('log').innerText = '';
}

chrome.windows.onCreated.addListener(function(createInfo) {
  appendToLog('windows.onCreated -- window: ' + createInfo.id);
  loadWindowList();
});

chrome.windows.onFocusChanged.addListener(function(windowId) {
  focusedWindowId = windowId;
  appendToLog('windows.onFocusChanged -- window: ' + windowId);
  loadWindowList();
});

chrome.windows.onRemoved.addListener(function(windowId) {
  appendToLog('windows.onRemoved -- window: ' + windowId);
  loadWindowList();
});

chrome.tabs.onCreated.addListener(function(tab) {
  appendToLog(
      'tabs.onCreated -- window: ' + tab.windowId + ' tab: ' + tab.id +
      ' title: ' + tab.title + ' index ' + tab.index + ' url ' + tab.url);
  loadWindowList();
});

chrome.tabs.onAttached.addListener(function(tabId, props) {
  appendToLog(
      'tabs.onAttached -- window: ' + props.newWindowId + ' tab: ' + tabId +
      ' index ' + props.newPosition);
  loadWindowList();
});

chrome.tabs.onMoved.addListener(function(tabId, props) {
  appendToLog(
      'tabs.onMoved -- window: ' + props.windowId + ' tab: ' + tabId +
      ' from ' + props.fromIndex + ' to ' +  props.toIndex);
  loadWindowList();
});

function refreshTab(tabId) {
  chrome.tabs.get(tabId, function(tab) {
    var input = new JsExprContext(tab);
    var output = document.getElementById('tab_' + tab.id);
    jstProcess(input, output);
    appendToLog('tab refreshed -- tabId: ' + tab.id + ' url: ' + tab.url);
  });
}

chrome.tabs.onUpdated.addListener(function(tabId, props) {
  appendToLog(
      'tabs.onUpdated -- tab: ' + tabId + ' status ' + props.status +
      ' url ' + props.url);
  refreshTab(tabId);
});

chrome.tabs.onDetached.addListener(function(tabId, props) {
  appendToLog(
      'tabs.onDetached -- window: ' + props.oldWindowId + ' tab: ' + tabId +
      ' index ' + props.oldPosition);
  loadWindowList();
});

chrome.tabs.onSelectionChanged.addListener(function(tabId, props) {
  appendToLog(
      'tabs.onSelectionChanged -- window: ' + props.windowId + ' tab: ' +
      tabId);
  loadWindowList();
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  appendToLog('tabs.onRemoved -- tab: ' + tabId);
  loadWindowList();
});

function createWindow() {
  var args = {
    'left': parseInt(document.getElementById('new_window_left').value),
    'top': parseInt(document.getElementById('new_window_top').value),
    'width': parseInt(document.getElementById('new_window_width').value),
    'height': parseInt(document.getElementById('new_window_height').value),
    'url': document.getElementById('new_window_url').value
  }

  if (!isInt(args.left))
    delete args.left;
  if (!isInt(args.top))
    delete args.top;
  if (!isInt(args.width))
    delete args.width;
  if (!isInt(args.height))
    delete args.height;
  if (!args.url)
    delete args.url;

  try {
    chrome.windows.create(args);
  } catch(e) {
    alert(e);
  }
}

function refreshWindow(windowId) {
  chrome.windows.get(windowId, function(window) {
    chrome.tabs.getAllInWindow(window.id, function(tabList) {
      window.tabs = tabList;
      var input = new JsExprContext(window);
      var output = document.getElementById('window_' + window.id);
      jstProcess(input, output);
      appendToLog(
          'window refreshed -- windowId: ' + window.id + ' tab count:' +
          window.tabs.length);
    });
  });
}

function updateWindowData(id) {
  var retval = {
    left: parseInt(document.getElementById('left_' + id).value),
    top: parseInt(document.getElementById('top_' + id).value),
    width: parseInt(document.getElementById('width_' + id).value),
    height: parseInt(document.getElementById('height_' + id).value)
  }
  if (!isInt(retval.left))
    delete retval.left;
  if (!isInt(retval.top))
    delete retval.top;
  if (!isInt(retval.width))
    delete retval.width;
  if (!isInt(retval.height))
    delete retval.height;

  return retval;
}

function updateWindow(id){
  try {
    chrome.windows.update(id, updateWindowData(id));
  } catch (e) {
    alert(e);
  }
}

function removeWindow(windowId) {
  try {
    chrome.windows.remove(windowId, function() {
      appendToLog('window: ' + windowId + ' removed.');
    });
  } catch (e) {
    alert(e);
  }
}

function refreshSelectedTab(windowId) {
  chrome.tabs.query({active: true, currentWindow: true} function(tabs) {
    var input = new JsExprContext(tabs[0]);
    var output = document.getElementById('tab_' + tabs[0].id);
    jstProcess(input, output);
    appendToLog(
        'selected tab refreshed -- tabId: ' + tabs[0].id +
        ' url:' + tabs[0].url);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  bootStrap();
});