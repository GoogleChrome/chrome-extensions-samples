var cookies = {};
document.__defineSetter__('cookie', function(value) {
  if (value.indexOf(';') < 0) {
    return;
  }

  var cookie_name = value.substring(0, value.indexOf('='));
  var cookie_value = value.substring(cookie_name.length + 1, value.indexOf(';'));
  cookies[cookie_name] = cookie_value;
});

document.__defineGetter__('cookie', function() {
  var result = [];
  for (var cookie in cookies) {
    result.push(cookie + '=' + cookies[cookie]);
  }
  return result.join('; ');
});

history.__defineGetter__('length', function() {
  return 0;
});

var _gaq = _gaq || [];
window.addEventListener('message', function(message) {
  _gaq.push(message.data);
});
