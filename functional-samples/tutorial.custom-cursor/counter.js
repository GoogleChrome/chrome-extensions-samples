document.addEventListener('click', async () => {
  chrome.runtime.sendMessage('page-click');
});
