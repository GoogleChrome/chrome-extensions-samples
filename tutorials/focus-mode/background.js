// Copyright 2022 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Wrap in an onInstalled callback in order to avoid unnecessary work
// every time the background script is run
chrome.runtime.onInstalled.addListener(() => {
  // Extension action is disabled by default
  chrome.action.disable();
  chrome.action.setBadgeText({
    text: "OFF",
  });

  // Clear all rules to ensure only our expected rules are set
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    // Declare a rule to activate the extension action on extension and webstore docs
    let supportedUrls = {
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            hostEquals: "developer.chrome.com",
            pathPrefix: "/docs/extensions",
          },
        }),
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            hostEquals: "developer.chrome.com",
            pathPrefix: "/docs/webstore",
          },
        }),
      ],
      actions: [new chrome.declarativeContent.ShowAction()],
    };

    // Apply our new array of rules
    let rules = [supportedUrls];
    chrome.declarativeContent.onPageChanged.addRules(rules);

  });
});

// When the user clicks on the extension action
chrome.action.onClicked.addListener(async (tab) => {
  // We retrieve the action badge to check if the extension is 'ON' or 'OFF'
  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  // Next state will always be the opposite
  const nextState = prevState === 'ON' ? 'OFF' : 'ON'
  
  // Set the action badge to the next state
  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: nextState,
  });

  if (nextState === "ON") {
    // Insert the CSS file when the user turns the extension on
    await chrome.scripting.insertCSS({
      files: ["focus-mode.css"],
      target: { tabId: tab.id },
    });
  } else if(nextState === "OFF") {
    // Remove the CSS file when the user turns the extension off
    await chrome.scripting.removeCSS({
      files: ["focus-mode.css"],
      target: { tabId: tab.id },
    });
  }
});
