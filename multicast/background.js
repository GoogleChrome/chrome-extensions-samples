var kIP = "237.132.123.123";
var kPort = 3038;
var chatClient;
var clientId;

function random_string(length) {
  var str = '';
  for (var i = 0; i < length; i++) {
    str += (Math.random() * 16 >> 0).toString(16);
  }
  return str;
}

function rtm(message, callback) {
  if (callback) {
    chrome.runtime.sendMessage(chrome.runtime.id, message, callback);
  } else {
    chrome.runtime.sendMessage(chrome.runtime.id, message);
  }
}

function onInitWindow(appWindow) {
  appWindow.show();
  var document = appWindow.contentWindow.document;
  document.addEventListener('DOMContentLoaded', function () {
    rtm({
      "type": 'init',
      clientId: clientId
    }, function () {
      chatClient.enter();
    });
  });
  appWindow.onClosed.addListener(function(){
    chatClient.exit();
  });
}

function createMainWindow() {
  chrome.app.window.create('index.html', {
    singleton: true,
    id: 'main-window',
    minWidth: 400,
    minHeight: 275,
    frame: 'none',
    bounds: {
      left: 100,
      top: 100,
      width: 650,
      height: 520
    },
    hidden: true
  }, onInitWindow);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message) {
    switch (message.type) {
      case 'set-client-id':
        chatClient.renameTo(message.value, function (name) {
          chrome.storage.local.set({
            'client_id': message.value
          }, function(){
            sendResponse(name);
            clientId = name;
            rtm({
              type: 'refresh-user-list'
            });
          });
        });
        return true;
        break;
      case 'query-users':
        sendResponse(chatClient.knownUsers);
        break;
      case 'send-message':
        chatClient.sendMessage(message.message, function () {
          sendResponse(true);
        });
        return true;
        break;
    }
  }
  return false;
});

function initClient(id) {
  var cc = new ChatClient({
    name: id,
    address: kIP,
    port: kPort
  });
  cc.onInfo = function (message, level) {
    level = level || 'info';
    rtm({
      type: 'info',
      level: level,
      message: message
    });
  };
  cc.onAddUser = function (name, ip) {
    rtm({
      type: 'add-user',
      name: name,
      ip: ip
    })
  };
  cc.onRemoveUser = function (name, ip) {
    rtm({
      type: 'remove-user',
      name: name,
      ip: ip
    })
  };
  cc.onMessage = function (message, name, ip) {
    rtm({
      type: 'message',
      name: name,
      message: message
    })
  };
  clientId = id;
  chatClient = cc;
}

chrome.storage.local.get('client_id', function (result) {
  if (result && ('client_id' in result)) {
    initClient(result.client_id);
  } else {
    var id = 'client' + random_string(16);
    chrome.storage.local.set({
      'client_id': id
    }, function () {
      initClient(id);
    });
  }
});

chrome.app.runtime.onLaunched.addListener(function () {
  function waitForChatClient() {
    if (clientId) {
      createMainWindow();
    } else {
      setTimeout(waitForChatClient);
    }
  }
  waitForChatClient();
});
