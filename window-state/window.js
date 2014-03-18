// Variables:

var fullscreenChangeCount = 0;
var fullscreenErrorCount = 0;

var kHiddenWindowDelay = 3000;
var kDefaultWidth = 1000;
var kDefaultHeight = 600;

// Utils:

function setIfANumber(dictionary, field, numberEdit) {
  var value = $('#' + numberEdit).val();
  var number = parseInt(value);
  if (!isNaN(number))
    dictionary[field] = number;
}

function getNumber(numberEdit) {
  var value = $('#' + numberEdit).val();
  var number = parseInt(value);
  if (!isNaN(number))
    return number;

  value = $('#' + numberEdit).attr('placeholder');
  if (!isNaN(number))
    return number;

  return null;
}

function setNumberEdit(value, numberEdit, attr) {
  if (attr === 'value' && value === null)
    $('#' + numberEdit)[0].value = '';
  else
    $('#' + numberEdit).attr(attr, value);
}

function getBounds(prefix) {
  var bounds = {};
  setIfANumber(bounds, 'left', prefix + 'WindowLeft');
  setIfANumber(bounds, 'top', prefix + 'WindowTop');
  setIfANumber(bounds, 'width', prefix + 'WindowWidth');
  setIfANumber(bounds, 'height', prefix + 'WindowHeight');
  setIfANumber(bounds, 'minWidth', prefix + 'WindowMinWidth');
  setIfANumber(bounds, 'minHeight', prefix + 'WindowMinHeight');
  setIfANumber(bounds, 'maxWidth', prefix + 'WindowMaxWidth');
  setIfANumber(bounds, 'maxHeight', prefix + 'WindowMaxHeight');
  return bounds;
}

function setBounds(bounds, prefix, attr) {
  setNumberEdit(bounds.left, prefix + 'WindowLeft', attr);
  setNumberEdit(bounds.top, prefix + 'WindowTop', attr);
  setNumberEdit(bounds.width, prefix + 'WindowWidth', attr);
  setNumberEdit(bounds.height, prefix + 'WindowHeight', attr);
  setNumberEdit(bounds.minWidth, prefix + 'WindowMinWidth', attr);
  setNumberEdit(bounds.minHeight, prefix + 'WindowMinHeight', attr);
  setNumberEdit(bounds.maxWidth, prefix + 'WindowMaxWidth', attr);
  setNumberEdit(bounds.maxHeight, prefix + 'WindowMaxHeight', attr);
}

// Create new window:

function createNewWindow() {
  optionsDictionary = {};
  var callback = undefined;

  if ($('#newWindowId').val() !== 'none')
    optionsDictionary.id = $('#newWindowId').val();
  optionsDictionary.state = $('#newWindowState').val();
  optionsDictionary.frame = $('input[name=newWindowFrame]:checked').val();
  optionsDictionary.hidden = $('input[name=newWindowHidden]:checked').val() === 'hidden';
  optionsDictionary.resizable = $('#newWindowResizable').is(':checked');
  optionsDictionary.alwaysOnTop = $('#newWindowOnTop').is(':checked');
  optionsDictionary.focused = $('#newWindowFocused').is(':checked');

  if (optionsDictionary.hidden) {
    callback = function (win) {
      setTimeout(function () { win.show(); }, kHiddenWindowDelay);
    }
  }

  var boundsType = $('input[name=newWindowBoundsType]:checked').val();
  optionsDictionary[boundsType] = getBounds('new');

  chrome.app.window.create('window.html', optionsDictionary, callback);
}

function copyWindowBounds() {
  var win = chrome.app.window.current();
  var boundsType = $('input[name=newWindowBoundsType]:checked').val();
  setBounds(win[boundsType], 'new', 'value');
}

function initCreateWindowTab() {
  // Initialize default state.
  setBounds({ width: kDefaultWidth, height: kDefaultHeight }, 'new', 'value');

  // Event handlers
  $('#newWindow').button().click(createNewWindow);
  $('#copyWindowBounds').click(copyWindowBounds);
}

// Arrays that store previous state values, which are cleared after a delay.
var wasFullscreen = [];
var wasMaximized = [];
var wasMinimized = [];
var wasHidden = [];
var kWasStateDelay = 10 * 1000;

// Stash values into 'was' variables and clear them out after a delay.
function setWasState(wasStateArray, state) {
  if (state) {
    wasStateArray.push(true);
    setTimeout(function () { wasStateArray.pop() }, kWasStateDelay);
  }
}

function updateCurrentStateReadout() {
  var win = chrome.app.window.current();
  $('#isFullscreen').attr('checked', win.isFullscreen());
  $('#isMaximized' ).attr('checked', win.isMaximized());
  $('#isMinimized' ).attr('checked', win.isMinimized());
  $('#isHidden'    ).attr('checked', document.webkitHidden);

  // Stash values into 'was' variables and clear them out after a delay.
  setWasState(wasFullscreen, win.isFullscreen());
  setWasState(wasMaximized, win.isMaximized());
  setWasState(wasMinimized, win.isMinimized());
  setWasState(wasHidden, document.webkitHidden);

  // Display the current 'was' variables.
  $('#wasFullscreen').attr('checked', wasFullscreen.length > 0);
  $('#wasMaximized' ).attr('checked', wasMaximized.length > 0);
  $('#wasMinimized' ).attr('checked', wasMinimized.length > 0);
  $('#wasHidden'    ).attr('checked', wasHidden.length > 0);

  // Also update the hinted window size.
  setBounds(win.innerBounds, 'inner', 'placeholder');
  setBounds(win.outerBounds, 'outer', 'placeholder');
}

// Edit current window:

function initEditWindowTab() {
  // Initialize the buttons.
  $('#fullscreen').button().click(function() {
    chrome.app.window.current().fullscreen();
  });

  $('#maximize').button().click(function() {
    chrome.app.window.current().maximize();
  });

  $('#minimize').button().click(function() {
    chrome.app.window.current().minimize();
  });

  $('#restore').button().click(function() {
    chrome.app.window.current().restore();
  });

  $('#hide').button().click(function() {
    setTimeout(function() {
      chrome.app.window.current().show();
    }, kHiddenWindowDelay);
    chrome.app.window.current().hide();
  });

  $('#showInactive').button().click(function() {
    setTimeout(function() {
      chrome.app.window.current().show(false);
    }, kHiddenWindowDelay);
    chrome.app.window.current().hide();
  });

  $('#drawAttention').button().click(function() {
    chrome.app.window.current().drawAttention();
  });

  $('#clearAttention').button().click(function() {
    chrome.app.window.current().clearAttention();
  });

  $('#close').button().click(function() {
    chrome.app.window.current().close();
  });

  // Initialize the current state.
  var win = chrome.app.window.current();
  $('#currentWindowId').val(win.id);
  $('#currentWindowOnTop')
    .attr('checked', win.isAlwaysOnTop())
    .change(function() {
      chrome.app.window.current().setAlwaysOnTop(
        $('#currentWindowOnTop').is(':checked'));
    });

  // Update window state display on bounds change, but also on regular interval
  // just to be paranoid.
  updateCurrentStateReadout();
  win.onBoundsChanged.addListener(updateCurrentStateReadout);
  setInterval(updateCurrentStateReadout, 1000);
}

// Edit bounds:

function initBoundsControls() {
  $('#setOuterPosition').click(function() {
    chrome.app.window.current().outerBounds.setPosition(
      getNumber('outerWindowLeft'),
      getNumber('outerWindowTop')
    );
  });

  $('#setOuterSize').click(function() {
    chrome.app.window.current().outerBounds.setSize(
      getNumber('outerWindowWidth'),
      getNumber('outerWindowHeight')
    );
  });

  $('#setOuterMinSize').click(function() {
    chrome.app.window.current().outerBounds.setMinimumSize(
      getNumber('outerWindowMinWidth'),
      getNumber('outerWindowMinHeight')
    );
  });

  $('#clearOuterMinSize').click(function() {
    chrome.app.window.current().outerBounds.setMinimumSize(null, null);
    setNumberEdit(null, 'outerWindowMinWidth', 'value');
    setNumberEdit(null, 'outerWindowMinHeight', 'value');
  });

  $('#setOuterMaxSize').click(function() {
    chrome.app.window.current().outerBounds.setMaximumSize(
      getNumber('outerWindowMaxWidth'),
      getNumber('outerWindowMaxHeight')
    );
  });

  $('#clearOuterMaxSize').click(function() {
    chrome.app.window.current().outerBounds.setMaximumSize(null, null);
    setNumberEdit(null, 'outerWindowMaxWidth', 'value');
    setNumberEdit(null, 'outerWindowMaxHeight', 'value');
  });

  $('#setInnerPosition').click(function() {
    chrome.app.window.current().innerBounds.setPosition(
      getNumber('innerWindowLeft'),
      getNumber('innerWindowTop')
    );
  });

  $('#setInnerSize').click(function() {
    chrome.app.window.current().innerBounds.setSize(
      getNumber('innerWindowWidth'),
      getNumber('innerWindowHeight')
    );
  });

  $('#setInnerMinSize').click(function() {
    chrome.app.window.current().innerBounds.setMinimumSize(
      getNumber('innerWindowMinWidth'),
      getNumber('innerWindowMinHeight')
    );
  });

  $('#clearInnerMinSize').click(function() {
    chrome.app.window.current().innerBounds.setMinimumSize(null, null);
    setNumberEdit(null, 'innerWindowMinWidth', 'value');
    setNumberEdit(null, 'innerWindowMinHeight', 'value');
  });

  $('#setInnerMaxSize').click(function() {
    chrome.app.window.current().innerBounds.setMaximumSize(
      getNumber('innerWindowMaxWidth'),
      getNumber('innerWindowMaxHeight')
    );
  });

  $('#clearInnerMaxSize').click(function() {
    chrome.app.window.current().innerBounds.setMaximumSize(null, null);
    setNumberEdit(null, 'innerWindowMaxWidth', 'value');
    setNumberEdit(null, 'innerWindowMaxHeight', 'value');
  });
}

// HTML5 Fullscreen:

function updateFullscreenLabel() {
  $('#html-fullscreen-label').text(
      fullscreenChangeCount + ' change, ' +
      fullscreenErrorCount +  ' error events.');
}

function initFullscreenTab() {
  updateFullscreenLabel();  // Initial text update.

  document.onwebkitfullscreenchange = function () {
    fullscreenChangeCount++;
    console.log("onwebkitfullscreenchange");
    updateFullscreenLabel();
  }

  document.onwebkitfullscreenerror = function () {
    fullscreenErrorCount++;
    console.log("onwebkitfullscreenerror");
    updateFullscreenLabel();
  }

  $('#html-fullscreen-enter').button().click(function(e) {
    $('#fullscreen-area')[0].webkitRequestFullscreen();
  });

  $('#html-fullscreen-exit').button().click(function(e) {
    document.webkitExitFullscreen();
  });
}

// Layout:

function resizeContent() {
  $('#tabs').height($(window).height());
}

// Main:

$(document).ready(function() {
  // Initialize the layout of the window.
  $('#tabs').tabs();
  $(window).resize(resizeContent);
  setTimeout(resizeContent, 200);
  $('#accordion').accordion({ heightStyle: 'content' });

  // Initialize the tabs.
  initCreateWindowTab();
  initEditWindowTab();
  initBoundsControls();
  initFullscreenTab();
});
