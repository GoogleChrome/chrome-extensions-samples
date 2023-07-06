/**
 * Stores a state every time it changes, up to 20 items.
 */
chrome.idle.onStateChanged.addListener(async function (newstate) {
  let { history_log } = await chrome.storage.session.get(['history_log']);
  if (!history_log) {
    history_log = [];
  }
  const time = Date.now();
  if (history_log.length >= 20) {
    history_log.pop();
  }
  history_log.unshift({ state: newstate, time: time });
  chrome.storage.session.set({ history_log: history_log });
});

/**
 * Opens history.html when the browser action is clicked.
 */
chrome.action.onClicked.addListener(function () {
  chrome.windows.create({
    url: 'history.html',
    width: 700,
    height: 600,
    type: 'popup'
  });
});
