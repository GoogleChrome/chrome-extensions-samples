/**
 * Convert a state and time into a nice styled chunk of HTML.
 */
function renderState(state, time) {
  const now = Date.now();
  const diff = Math.round((time - now) / 1000);
  const str =
    diff == 0
      ? 'now'
      : Math.abs(diff) + ' seconds ' + (diff > 0 ? 'from now' : 'ago');
  const col = state == 'active' ? '#009900' : '#990000';
  return "<b style='color: " + col + "'>" + state + '</b> ' + str;
}

/**
 * Creates DOM and injects a rendered state into the page.
 */
function renderItem(state, time, parent) {
  const dom_item = document.createElement('li');
  dom_item.innerHTML = renderState(state, time);
  parent.appendChild(dom_item);
}

// Store previous state so we can show deltas.  This is important
// because the API currently doesn't fire idle messages, and we'd
// like to keep track of last time we went idle.
let laststate = null;
let laststatetime = null;

/**
 * Checks the current state of the browser.
 */
async function checkState() {
  const threshold = parseInt(document.querySelector('#idle-threshold').value);
  const dom_threshold = document.querySelector('#idle-set-threshold');
  dom_threshold.innerText = threshold;

  // Request the state based off of the user-supplied threshold.
  chrome.idle.queryState(threshold, function (state) {
    const time = new Date();
    if (laststate != state) {
      laststate = state;
      laststatetime = time;
    }

    // Keep rendering results so we get a nice "seconds elapsed" view.
    const dom_result = document.querySelector('#idle-state');
    dom_result.innerHTML = renderState(state, time);
    const dom_laststate = document.querySelector('#idle-laststate');
    dom_laststate.innerHTML = renderState(laststate, laststatetime);
  });
}

/**
 * Render the data gathered by the background service worker - should show a log
 * of "active" states.
 */
async function renderHistory() {
  const dom_history = document.querySelector('#idle-history');
  dom_history.innerHTML = '';
  const { history_log } = await chrome.storage.session.get(['history_log']);
  if (!history_log) {
    return;
  }

  for (let i = 0; i < history_log.length; i++) {
    const data = history_log[i];
    renderItem(data['state'], data['time'], dom_history);
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  // Set the threshold to the last value the user set, or 15 if not set.
  let { threshold: stored_threshold } = await chrome.storage.local.get([
    'threshold'
  ]);
  if (!stored_threshold || ![15, 30, 60].includes(stored_threshold)) {
    stored_threshold = 15;
  }

  document.querySelector(
    `#idle-threshold option[value="${stored_threshold}"]`
  ).selected = true;
  chrome.idle.setDetectionInterval(stored_threshold);

  document
    .querySelector('#idle-threshold')
    .addEventListener('change', function (e) {
      const threshold = parseInt(e.target.value);
      chrome.storage.local.set({ threshold: threshold });
      chrome.idle.setDetectionInterval(threshold);
    });

  // Check every second (even though this is overkill - minimum idle
  // threshold is 15 seconds) so that the numbers appear to be counting up.
  checkState();
  window.setInterval(checkState, 1000);

  // Check every second (see above).
  renderHistory();
  window.setInterval(renderHistory, 1000);
});
