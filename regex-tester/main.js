var evaluator, editor;
var baseUrl;

var onMessage = function(e) {
  var msg = e.data;
  switch (msg.type) {
  case 'match':
    evaluator.postMessage({ "type": msg.type,
			    "expression": msg.expression,
			    "text": msg.text,
			    "callback_id": msg.callback_id }, '*');
    break;
  case 'cb_match':
    editor.postMessage({ "type": msg.type,
			 "result": msg.result,
       "error_message": msg.error_message,
			 "callback_id": msg.callback_id }, '*');
    break;
  default:
    console.log("ERROR: unrecognized message type " + msg.type);
    break;
  }
};

var loadAndAdd = function(url, callback) {
  x = new XMLHttpRequest();
  x.open("GET", url, true);
  x.onreadystatechange = function() {
    if (x.readyState == 4 && x.status == 200) {
      var replacedSrc = x.responseText.replace(/__EXTENSION_BASE_URL__/gm,
        baseUrl);
      callback.call(window, replacedSrc);
    }
  };
  x.send();
}

var loadEvaluator = function() {
  evaluator = document.createElement('iframe');
  evaluator.className = 'sandboxed invisible';
  loadAndAdd('evaluator.html', function(text) {
    evaluator.src = "data:text/html;charset=utf-8," +
      encodeURIComponent(text);
    document.body.appendChild(evaluator);
    evaluator = evaluator.contentWindow;
    loadEditor();
  });
};

var loadEditor = function() {
  editor = document.createElement('iframe');
  editor.className = 'sandboxed';
  loadAndAdd('editor.html', function(text) {
    editor.src = "data:text/html;charset=utf-8," +
      encodeURIComponent(text);
    document.body.appendChild(editor);
    editor = editor.contentWindow;
  });
};

onload = function() {
  baseUrl = window.location.protocol + "//" + window.location.host;
  loadEvaluator();
  window.addEventListener("message", onMessage, false);
}
