function $(q) {
  return document.querySelector(q);
}

function show(q) {
  $(q).classList.remove('hide');
}

function hide(q) {
  $(q).classList.add('hide');
}

function validFileName(path) {
  if (!path.length) {
    error('Empty name was given.');
    return false;
  }
  if (path.indexOf('/') >= 0) {
    error('File name should not contain any slash (/): "' + path + '"');
    return false;
  }
  return true;
}

function log(msg) {
  document.getElementById('log').innerHTML = msg;
  console.log(msg, arguments);
}

function createElement(name, attributes) {
  var elem = document.createElement(name);
  for (var key in attributes) {
    if (key == 'id')
      elem.id = attributes[key];
    else if (key == 'innerText')
      elem.innerText = attributes[key];
    else
      elem.setAttribute(key, attributes[key]);
  }
  return elem;
}

function info(msg) {
  console.log('INFO: ', arguments);
  var e = document.getElementById('info');
  e.innerText = msg;
  e.classList.remove('hide');
  window.setTimeout(function() { e.innerHTML = ''; }, 5000);
}

function error(msg) {
  console.log('ERROR: ', arguments);
  var message = '';
  for (var i = 0; i < arguments.length; i++) {
    var description = '';
    if (arguments[i] instanceof FileError) {
      switch (arguments[i].code) {
        case FileError.QUOTA_EXCEEDED_ERR:
          description = 'QUOTA_EXCEEDED_ERR';
          break;
        case FileError.NOT_FOUND_ERR:
          description = 'NOT_FOUND_ERR';
          break;
        case FileError.SECURITY_ERR:
          description = 'SECURITY_ERR';
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          description = 'INVALID_MODIFICATION_ERR';
          break;
        case FileError.INVALID_STATE_ERR:
          description = 'INVALID_STATE_ERR';
          break;
        default:
          description = 'Unknown Error';
          break;
      }
      message += ': ' + description;
    } else if (arguments[i].fullPath) {
      message += arguments[i].fullPath + ' ';
    } else {
      message += arguments[i] + ' ';
    }
  }
  var e = document.getElementById('error');
  e.innerText = 'ERROR:' + message;
  e.classList.remove('hide');
  window.setTimeout(function() { e.innerHTML = ''; }, 5000);
}

