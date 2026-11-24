const button = new DOMParser().parseFromString(
  '<button>Click to open side panel</button>',
  'text/html'
).body.firstElementChild;
button.addEventListener('click', function () {
  chrome.runtime.sendMessage({ type: 'open_side_panel' });
});

chrome.runtime.sendMessage({ type: 'configure_side_panel' }, (response) => {
  if (chrome.runtime.lastError || response?.error) {
    console.error(chrome.runtime.lastError?.message || response.error);
    return;
  }

  document.body.append(button);
});
