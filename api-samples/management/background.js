chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uninstall') {
    // Uninstall the extension with the given id
    chrome.management.uninstall(message.id, (result) => {
      if (chrome.runtime.lastError) {
        // Handle error during uninstallation
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        // Show confirmation message when extension is successfully uninstalled
        sendResponse({ success: true });
      }
    });
  }
  return true; // Keep the message channel open for sendResponse
});
