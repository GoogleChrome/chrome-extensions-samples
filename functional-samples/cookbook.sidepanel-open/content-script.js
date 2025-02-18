const button = document.createElement('button');
button.textContent = 'Click to open side panel';
button.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'open_side_panel' });
});

document.body.appendChild(button);
