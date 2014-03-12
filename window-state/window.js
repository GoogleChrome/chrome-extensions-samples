// Variables:

var hiddenWindowDelay = 3000;
var fullscreenchangeCount = 0;
var fullscreenerrorCount = 0;
var newWindowOffset = 100;

// chrome.app.window alwaysOnTop property is supported in Chrome M32 or later.
// The option will be hidden if not supported in the current browser version.
var isAlwaysOnTopSupported = typeof(chrome.app.window.current().setAlwaysOnTop) !== 'undefined';

var version = window.navigator.appVersion;
version = version.substr(version.lastIndexOf('Chrome/') + 7);
version = version.substr(0, version.indexOf('.'));
version = parseInt(version);

var isFocusedSupported = version >= 33;

// Helper functions
$ = function(selector) { return document.querySelector(selector); }

function setIfANumber(dictionary, field, number) {
  if (isNaN(number))
    return;
  dictionary[field] = number
}

function createNewWindow(optionsDictionary) {
  optionsDictionary = optionsDictionary || {};

  if ($('[value=ID1]').checked)
    optionsDictionary.id = "ID1";
  else if ($('[value=ID2]').checked)
    optionsDictionary.id = "ID2";
  else
    optionsDictionary.id = undefined;

  optionsDictionary.singleton = $('[value=singleton]').checked;

  setIfANumber(optionsDictionary, 'minWidth', parseInt($('#newWindowWidthMin').value));
  setIfANumber(optionsDictionary, 'maxWidth', parseInt($('#newWindowWidthMax').value));
  setIfANumber(optionsDictionary, 'minHeight', parseInt($('#newWindowHeightMin').value));
  setIfANumber(optionsDictionary, 'maxHeight', parseInt($('#newWindowHeightMax').value));
  optionsDictionary.resizable = $('#newWindowResizable').checked;
  if (isAlwaysOnTopSupported)
    optionsDictionary.alwaysOnTop = $('#newWindowOnTop').checked;
  if (isFocusedSupported)
    optionsDictionary.focused = $('#newWindowFocused').checked;

  optionsDictionary.hidden = $('[value=hidden]').checked;
  var showAfterCreated = function (win) {
    setTimeout(function () { win.show(); }, hiddenWindowDelay);
  }
  var callback = optionsDictionary.hidden ? showAfterCreated : undefined;

  // Set new window to be offset from current window.
  var bounds = chrome.app.window.current().getBounds();
  bounds.left = (bounds.left + newWindowOffset) % (screen.width - bounds.width);
  bounds.top = (bounds.top + newWindowOffset) % (screen.height - bounds.height);
  optionsDictionary.bounds = {};
  optionsDictionary.bounds.left = bounds.left;
  optionsDictionary.bounds.top = bounds.top;
  optionsDictionary.bounds.width = bounds.width;
  optionsDictionary.bounds.height = bounds.height;

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

$('#alwaysOnTop').onchange = function(e) {
  chrome.app.window.current().setAlwaysOnTop($('#alwaysOnTop').checked);
};

$('#move').onclick = function(e) {
  var x = parseInt($('#moveWindowLeft').value);
  var y = parseInt($('#moveWindowTop').value);
  setTimeout(
    function() {
      chrome.app.window.current().moveTo(x, y);
    },
    $('#delay-slider').value);
};

$('#resize').onclick = function(e) {
  var w = parseInt($('#resizeWindowWidth').value);
  var h = parseInt($('#resizeWindowHeight').value);
  setTimeout(
    function() {
      chrome.app.window.current().resizeTo(w, h);
    },
    $('#delay-slider').value);
};

$('#setbounds').onclick = function(e) {
  var bounds = {};
  setIfANumber(bounds, 'left', parseInt($('#moveWindowLeft').value));
  setIfANumber(bounds, 'top', parseInt($('#moveWindowTop').value));
  setIfANumber(bounds, 'width', parseInt($('#resizeWindowWidth').value));
  setIfANumber(bounds, 'height', parseInt($('#resizeWindowHeight').value));
  setTimeout(
    function() {
      chrome.app.window.current().setBounds(bounds);
    },
    $('#delay-slider').value);
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
var wasHidden = [];
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
  $('#isHidden'    ).checked = document.webkitHidden;

  // Stash values into 'was' variables and clear them out after a delay.
  setWasState(wasFullscreen, chrome.app.window.current().isFullscreen());
  setWasState(wasMaximized, chrome.app.window.current().isMaximized());
  setWasState(wasMinimized, chrome.app.window.current().isMinimized());
  setWasState(wasHidden, document.webkitHidden);

  // Display the current 'was' variables.
  $('#wasFullscreen').checked = wasFullscreen.length > 0;
  $('#wasMaximized' ).checked = wasMaximized.length > 0;
  $('#wasMinimized' ).checked = wasMinimized.length > 0;
  $('#wasHidden'    ).checked = wasHidden.length > 0;

  // Also update the hinted window size
  $('#moveWindowLeft').placeholder = chrome.app.window.current().getBounds().left;
  $('#moveWindowTop').placeholder = chrome.app.window.current().getBounds().top;
  $('#resizeWindowWidth').placeholder = chrome.app.window.current().getBounds().width;
  $('#resizeWindowHeight').placeholder = chrome.app.window.current().getBounds().height;

  $('#newWindowWidthMin').placeholder = chrome.app.window.current().getBounds().width;
  $('#newWindowWidthMax').placeholder = chrome.app.window.current().getBounds().width;
  $('#newWindowHeightMin').placeholder = chrome.app.window.current().getBounds().height;
  $('#newWindowHeightMax').placeholder = chrome.app.window.current().getBounds().height;
}
// Update window state display on bounds change, but also on regular interval
// just to be paranoid.
chrome.app.window.current().onBoundsChanged.addListener(updateCurrentStateReadout);
setInterval(updateCurrentStateReadout, 1000);

// Set initial value of always on top
if (isAlwaysOnTopSupported) {
  $('#alwaysOnTop').checked = chrome.app.window.current().isAlwaysOnTop();
} else {
  $('#alwaysOnTopLabel').style.visibility = 'hidden';
  $('#newWindowOnTopLabel').style.visibility = 'hidden';
}

if (!isFocusedSupported) {
  $('#newWindowFocused').disabled = true;
}
