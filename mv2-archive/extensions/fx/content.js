/*
 * Content script for Chrome Sounds.
 * Tracks in-page events and notifies the background page.
 */

function sendEvent(event, value) {
  console.log("sendEvent: " + event + "," + value);
  chrome.extension.sendRequest({eventName: event, eventValue: value});
}

// Timers to trigger "stopEvent" for coalescing events.
var timers = {};

function stopEvent(type) {
  timers[type] = 0;
  sendEvent(type, "stopped");
}

// Automatically coalesces repeating events into a start and a stop event.
// |validator| is a function which should return true if the event is
// considered to be a valid event of this type.
function handleEvent(event, type, validator) {
  if (validator) {
    if (!validator(event)) {
      return;
    }
  }
  var timerId = timers[type];
  var eventInProgress = (timerId > 0);
  if (eventInProgress) {
    clearTimeout(timerId);
    timers[type] = 0;
  } else {
    sendEvent(type, "started");
  }
  timers[type] = setTimeout(stopEvent, 300, type);
}

function listenAndCoalesce(target, type, validator) {
  target.addEventListener(type, function(event) {
    handleEvent(event, type, validator);
  }, true);
}

listenAndCoalesce(document, "scroll");

// For some reason, "resize" doesn't seem to work with addEventListener.
if ((window == window.top) && document.body && !document.body.onresize) {
  document.body.onresize = function(event) {
    sendEvent("resize", "");
  };
}

listenAndCoalesce(document, "keypress", function(event) {
  if (event.charCode == 13)
    return false;

  // TODO(erikkay) This doesn't work in gmail's rich text compose window.
  return event.target.tagName == "TEXTAREA" ||
         event.target.tagName == "INPUT" ||
         event.target.isContentEditable;
});
