// Variables:

var hiddenWindowDelay = 3000;
var fullscreenchangeCount = 0;
var fullscreenerrorCount = 0;
var newWindowOffset = 100;

// Helper functions
$ = function(selector) { return document.querySelector(selector); }

function createNewWindow(optionsDictionary) {
  optionsDictionary = optionsDictionary || {};

  if ($('[value=ID1]').checked)
    optionsDictionary.id = "ID1";
  else if ($('[value=ID2]').checked)
    optionsDictionary.id = "ID2";
  else
    optionsDictionary.id = undefined;

  optionsDictionary.singleton = $('[value=singleton]').checked;

  optionsDictionary.hidden = $('[value=hidden]').checked;
  var showAfterCreated = function (win) {
    setTimeout(function () { win.show(); }, hiddenWindowDelay);
  }
  var callback = optionsDictionary.hidden ? showAfterCreated : undefined;

  // Set new window to be offset from current window.
  var bounds = chrome.app.window.current().getBounds();
  bounds.left = (bounds.left + newWindowOffset) % (screen.width - bounds.width);
  bounds.top = (bounds.top + newWindowOffset) % (screen.height - bounds.height);
  optionsDictionary.left = bounds.left;
  optionsDictionary.top = bounds.top;
  optionsDictionary.width = bounds.width;
  optionsDictionary.height = bounds.height;

  chrome.app.window.create('window.html', optionsDictionary, callback);
};

// Log events:

var updateFulllscreenLabel = function updateFulllscreenLabel() {
  $('#html-fullscreen-label').innerText =
    fullscreenchangeCount + " change, " +
    fullscreenerrorCount + " error events.";
}
updateFulllscreenLabel();  // Initial text update.

document.onwebkitfullscreenchange = function () {
  fullscreenchangeCount++;
  console.log("onwebkitfullscreenchange");
  updateFulllscreenLabel();
}

document.onwebkitfullscreenerror = function () {
  fullscreenerrorCount++;
  console.log("onwebkitfullscreenerror");
  updateFulllscreenLabel();
}

// Button handlers:

$('#html-fullscreen-enter').onclick = function(e) {
  $('#fullscreen-area').webkitRequestFullscreen();
};

$('#html-fullscreen-exit').onclick = function(e) {
  document.webkitExitFullscreen();
};

$('#fullscreen').onclick = function(e) {
  setTimeout(chrome.app.window.current().fullscreen, $('#delay-slider').value);
};

$('#maximize').onclick = function(e) {
  setTimeout(chrome.app.window.current().maximize, $('#delay-slider').value);
};

$('#minimize').onclick = function(e) {
  setTimeout(chrome.app.window.current().minimize, $('#delay-slider').value);
};

$('#restore').onclick = function(e) {
  setTimeout(chrome.app.window.current().restore, $('#delay-slider').value);
};

$('#hide').onclick = function(e) {
  setTimeout(chrome.app.window.current().hide, $('#delay-slider').value);
};

$('#show').onclick = function(e) {
  setTimeout(chrome.app.window.current().show, $('#delay-slider').value);
};

var updateDelaySiderText = function updateDelaySiderText() {
  $('#delay-label').innerText = $('#delay-slider').value / 1000 + " seconds.";
}

$('#delay-slider').onchange = updateDelaySiderText;
updateDelaySiderText();  // Initial text update.

$('#newWindowNormal').onclick = function(e) {
  createNewWindow();
};

$('#newWindowFullscreen').onclick = function(e) {
  createNewWindow({ state: 'fullscreen'});
};

$('#newWindowMaximized').onclick = function(e) {
  createNewWindow({ state: 'maximized'});
};

$('#newWindowMinimized').onclick = function(e) {
  createNewWindow({ state: 'minimized'});
};

// Current window state readout:

// Arrays that store previous state values, which are cleared after a delay.
var wasFullscreen = [];
var wasMaximized = [];
var wasMinimized = [];
var wasStateDelay = 10 * 1000;

// Stash values into 'was' variables and clear them out after a delay.
function setWasState(wasStateArray, state) {
  if (state) {
    wasStateArray.push(true);
    setTimeout(function () { wasStateArray.pop() }, wasStateDelay);
  }
}

function updateCurrentStateReadout() {
  $('#isFullscreen').checked = chrome.app.window.current().isFullscreen();
  $('#isMaximized' ).checked = chrome.app.window.current().isMaximized();
  $('#isMinimized' ).checked = chrome.app.window.current().isMinimized();

  // Stash values into 'was' variables and clear them out after a delay.
  setWasState(wasFullscreen, chrome.app.window.current().isFullscreen());
  setWasState(wasMaximized, chrome.app.window.current().isMaximized());
  setWasState(wasMinimized, chrome.app.window.current().isMinimized());

  // Display the current 'was' variables.
  $('#wasFullscreen').checked = wasFullscreen.length > 0;
  $('#wasMaximized' ).checked = wasMaximized.length > 0;
  $('#wasMinimized' ).checked = wasMinimized.length > 0;
}
// Update window state display on bounds change, but also on regular interval
// just to be paranoid.
chrome.app.window.current().onBoundsChanged.addListener(updateCurrentStateReadout);
setInterval(updateCurrentStateReadout, 1000);
