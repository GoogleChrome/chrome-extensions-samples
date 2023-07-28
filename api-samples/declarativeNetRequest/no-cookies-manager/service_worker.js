chrome.runtime.onInstalled.addListener(async function () {
  // restore the default rule if the extension is installed or updated
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((rule) => rule.id),
    addRules: [
      {
        id: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'cookie',
              operation: 'remove'
            }
          ]
        },
        condition: {
          urlFilter: '|*?no-cookies=1',
          resourceTypes: ['main_frame', 'xmlhttprequest']
        }
      },
      {
        id: 2,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'cookie',
              operation: 'remove'
            }
          ]
        },
        condition: {
          regexFilter: '.*\\.google\\.com',
          resourceTypes: ['main_frame', 'xmlhttprequest']
        }
      }
    ]
  });
});

chrome.declarativeNetRequest.setExtensionActionOptions({
  displayActionCountAsBadgeText: true
});
