onmessage = function(event) {
  // TODO(mihaip): validate event.origin
  var result = eval('(' + event.data + ')');

  top.postMessage(result, '*');
};
