document.addEventListener('click', () => {
  chrome.runtime.sendMessage('page-click');
});
