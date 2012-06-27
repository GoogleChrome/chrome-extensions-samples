var callback_ctr = 0;
var cached_callbacks = {};
var e_expr, e_text, e_err;

var sendToParent = function(args) {
  window.parent.postMessage(args, '*');
};

match = function(expression, text, callback) {
  var id = callback_ctr++;
  cached_callbacks[id] = callback;
  sendToParent({ "type": "match",
		 "expression": expression,
		 "text": text,
		 "callback_id": id
  });
};

var onMessage = function(e) {
  var msg = e.data;
  switch (msg.type) {
  case 'cb_match':
    cached_callbacks[msg.callback_id].call(window, msg.result,
      msg.error_message);
    delete cached_callbacks[msg.callback_id];
    return;
  default:
    console.log("ERROR: unrecognized message type " + msg.type);
  }
};

var onMatch = function(result, error_message) {
  console.log(result + " and " + error_message);
  e_err.innerText = "";
  if (result) {
    e_text.className = "match";
  } else {
    e_text.className = "";
    if (error_message) {
      e_err.innerText = error_message;
    }
  }
}

var doMatch = function() {
  var expression = e_expr.value;
  var text = e_text.value;
  match(expression, text, onMatch);
}

var onWindowReady = function() {
  window.addEventListener('message', onMessage);

  e_expr = document.getElementById('expression');
  e_text = document.getElementById('text');
  e_err = document.getElementById('err');

  e_expr.addEventListener('input', doMatch);
  e_text.addEventListener('input', doMatch);
  doMatch();
};

window.onload = onWindowReady;
