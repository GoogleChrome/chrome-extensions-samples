chrome.commands.onCommand.addListener(async function (command) {
  if (command == 'toggle-pin') {
    // Get the currently selected tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    // Toggle the pinned status
    const current = tabs[0];
    chrome.tabs.update(current.id, { pinned: !current.pinned });
  }
});
