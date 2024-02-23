chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uninstall') {
    // Uninstall the extension with the given id
    chrome.management.uninstall(message.id, (result) => {
      console.log('Uninstall result:', result);
      sendResponse(result); // Send response back to the popup
    });
  }
  return true; // Keep the message channel open for sendResponse
});
