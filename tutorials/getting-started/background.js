chrome.runtime.onInstalled.addListener(() => {
  let color = '#3aa757';
  chrome.storage.sync.set({ color });
  console.log('Set default color to %cgreen', `color: ${color}`);
});
