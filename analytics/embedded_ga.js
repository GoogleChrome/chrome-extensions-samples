var cookies = {};

/**
 * Defines a setter for cookies that intercepts
 * the call to set the cookie string and converts
 * it into an object for easier consumption
 */
document.__defineSetter__('cookie', function(value) {
  if (value.indexOf(';') < 0) {
    return;
  }

  var cookie_name = value.substring(0, value.indexOf('='));
  var cookie_value = value.substring(cookie_name.length + 1, value.indexOf(';'));
  cookies[cookie_name] = cookie_value;
});

/**
 * Defines a getter for cookies that intercepts
 * the call to get the cookie string and converts
 * our cookies object into that anticipated string value
 */
document.__defineGetter__('cookie', function() {
  var result = [];
  for (var cookie in cookies) {
    result.push(cookie + '=' + cookies[cookie]);
  }
  return result.join('; ');
});

/**
 * Enforces a history length of zero
 */
history.__defineGetter__('length', function() {
  return 0;
});

/**
 * Tracks messages sent to the window in GA
 */
var _gaq = _gaq || [];
window.addEventListener('message', function(message) {
  _gaq.push(message.data);
});
