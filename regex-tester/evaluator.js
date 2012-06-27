// See http://simonwillison.net/2006/jan/20/escape/
RegExp.escape = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

var onMessage = function(e) {
  var msg = e.data;
  switch (msg.type) {
  case 'match':
    var stringToEval = "'" + msg.text + "'.match(" +
      RegExp.escape(msg.expression) + ") != null";
    var error_message;
    var result;
    try {
      result = eval(stringToEval);
    } catch (e) {
      error_message = e.message;
    }
    e.source.postMessage({ "type": "cb_match",
         "result": result,
         "error_message": error_message,
			   "callback_id": msg.callback_id }, '*');
    return;
  default:
    console.log("ERROR: unrecognized message type " + msg.type);
  }
};

var onWindowReady = function() {
  window.addEventListener('message', onMessage);
};

window.onload = onWindowReady;
