// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

let contentEl = document.getElementById('content');
let pageEl = document.getElementById('page');

contentEl.addEventListener('click', async (_event) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // TODO: remove duplicate `scripting.executeScript` calls once files supports arrays of length > 1

  // Polyfill library required because the content script world does not have access to the
  // customElements global.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['third-party/custom-elements.min.js'],
  });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['ce-define.js'],
  });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['ce-instantiate.js'],
  });
});

pageEl.addEventListener('click', async (_event) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scriptInjector,
  });
});

// This function is injected into the page as a content script. It in turn injects script tags into
// the host page and those scripts execute in the page's world.
function scriptInjector() {
  console.log('Using scriptInjector function to add a script to the host page');

  let defineScript = document.createElement('script');
  defineScript.src = chrome.runtime.getURL('ce-define.js');

  let injectScript = document.createElement('script');
  injectScript.src = chrome.runtime.getURL('ce-instantiate.js');

  document.body.append(defineScript, injectScript);
}
