function rtm(message, callback) {
  if (callback) {
    chrome.runtime.sendMessage(chrome.runtime.id, message, callback);
  } else {
    chrome.runtime.sendMessage(chrome.runtime.id, message);
  }
}

function setClientId(name, callback) {
  chrome.runtime.sendMessage(chrome.runtime.id, {
    type: "set-client-id",
    value: name
  }, callback);
}

function startEditClientId() {
  var clientIdBox = document.getElementById('client-id');

  setTimeout(function () {
    clientIdBox.setAttribute('contenteditable', 'true');
    clientIdBox.focus();
    clientIdBox.onblur = function () {
      clientIdBox.onblur = null;
      clientIdBox.removeAttribute('contenteditable');
      setClientId(clientIdBox.textContent, function (name) {
        clientIdBox.textContent = name;
      });
    };
  }, 1);
}

var knowUsers = new Collection();

function refreshUserList() {
  rtm({
    type: 'query-users'
  }, function (result) {
    var names = Object.keys(result);
    names.sort();
    var userList = document.getElementById('user-list');
    if (names.length == 0) {
      userList.innerHTML = '<li>(No user found)</li>';
    } else {
      userList.innerHTML = '';
      names.forEach(function (name) {
        for (var ip in result[name]) {
          var userItem = document.createElement('li');
          userItem.textContent = '[' + name + ']';
          userItem.title = "From: " + ip;
          knowUsers.put(name + ' ' + ip, userItem);
        }
      });
      knowUsers.sortByKeys();
      knowUsers.forEach(function (value, key) {
        userList.appendChild(value);
      });
    }
  });
}

function removeUser(name, ip) {
  var key = name + ' ' + ip;
  var node = knowUsers.get(key);
  if (node) {
    node.parentNode.removeChild(node);
    knowUsers.remove(key);
  }
  if (knowUsers.length == 0) {
    document.getElementById('user-list').innerHTML = '<li>(No user found)</li>';
  }
}

function addUser(name, ip) {
  var key = name + ' ' + ip;
  if (knowUsers.get(key)) {
    return;
  }
  var userList = document.getElementById('user-list');
  var userItem = document.createElement('li');
  userItem.textContent = '[' + name + ']';
  userItem.title = "From: " + ip;
  var keys = knowUsers.keys();
  if (keys.length == 0) {
    userList.innerHTML = '';
  }
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] > key) {
      break;
    }
  }
  if (i < keys.length) {
    userList.insertBefore(userItem, knowUsers.getByIndex(i));
  } else {
    userList.appendChild(userItem);
  }
  knowUsers.put(key, userItem);
}

function sendMessage() {
  var messageInputBox = document.getElementById('input-box');
  var message = messageInputBox.value;
  messageInputBox.setAttribute('readonly', '');
  rtm({
    type: 'send-message',
    message: message
  }, function () {
    messageInputBox.value = '';
    messageInputBox.removeAttribute('readonly');
  });

}

function init(clientId) {
  var clientIdBox = document.getElementById('client-id');
  clientIdBox.textContent = clientId;
  clientIdBox.ondblclick = startEditClientId;
  var messageInputBox = document.getElementById('input-box');
  messageInputBox.addEventListener('keydown', function (e) {
    if (e.keyCode == 13 && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      sendMessage();
    }
  });

  var toggleHelp = document.getElementById('toggle-help');
  toggleHelp.onclick = function () {
    var helpText = document.getElementById('help');
    helpText.classList.toggle('hide-help');
  };

  var closeBox = document.getElementById('close');
  closeBox.onclick = function () {
    chrome.app.window.current().close();
  };

  var splitter = document.getElementById('splitter');
  chrome.storage.local.get('input-panel-size', function (obj) {
    if (obj['input-panel-size']) {
      var inputPanel = document.getElementById('input-panel');
      inputPanel.style.height = obj['input-panel-size'] + 1 + 'px';
    }
  });
  splitter.onmousedown = function (e) {
    if (e.button != 0) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    var inputPanel = document.getElementById('input-panel');
    var totalHeight = document.body.scrollHeight;
    var panelHeight = inputPanel.scrollHeight;
    var startY = e.pageY;
    var MouseMove;
    document.addEventListener('mousemove', MouseMove = function (e) {
      e.stopPropagation();
      e.preventDefault();
      var dy = e.pageY - startY;
      if (panelHeight - dy < 120) {
        dy = panelHeight - 120;
      }
      if (totalHeight - panelHeight + dy < 120) {
        dy = 120 - totalHeight + panelHeight;
      }
      inputPanel.style.height = panelHeight - dy + 1 + 'px';
      chrome.storage.local.set({'input-panel-size': panelHeight - dy});
    });
    document.addEventListener('mouseup', function MouseUp(e) {
      MouseMove(e);
      document.removeEventListener('mousemove', MouseMove);
      document.removeEventListener('mouseup', MouseUp);
    });
  };
  refreshUserList();
}

function onMessageArrived(message, name) {
  var newMessageLi = document.createElement('li');
  var nameBlock = document.createElement('h4');
  nameBlock.textContent = name + ":";
  newMessageLi.appendChild(nameBlock);
  var messageBlock = document.createElement('pre');
  messageBlock.textContent = message;
  newMessageLi.appendChild(messageBlock);
  document.getElementById('messages').appendChild(newMessageLi);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  var newMessageLi;
  var messages = document.getElementById('messages');
  if (message) {
    switch (message.type) {
      case 'init':
        init(message.clientId);
        sendResponse("Done");
        return true;
      case 'set-client-id':
        document.getElementById('client-id').textContent = message.value;
        break;
      case 'message':
        onMessageArrived(message.message, message.name);
        break;
      case 'remove-user':
        removeUser(message.name, message.ip);
        break;
      case 'add-user':
        addUser(message.name, message.ip);
        break;
      case 'refresh-user-list':
        refreshUserList();
        break;
      case 'info':
        newMessageLi = document.createElement('li');
        newMessageLi.textContent = message.message;
        newMessageLi.setAttribute("class", message.level);
        messages.appendChild(newMessageLi);
        break;
    }
  }
});