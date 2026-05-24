const button = new DOMParser().parseFromString(
  '<button>Click to open side panel</button>',
  'text/html'
).body.firstElementChild;
button.disabled = true;
button.addEventListener('click', function () {
  chrome.runtime.sendMessage({ type: 'open_side_panel' });
});
document.body.append(button);

chrome.runtime.sendMessage({ type: 'enable_tab_side_panel' }, () => {
  button.disabled = false;
});
