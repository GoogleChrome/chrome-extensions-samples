// Returns a new notification ID used in the notification.
var notificationId = 0;
function getNotificationId() {
  notificationId++;
  return notificationId.toString();
}

function messageReceived(message) {
  // A message is an object with a data property that
  // consists of key-value pairs.

  // Concatenate all key-value pairs to form a display string.
  var messageString = "";
  for (var key in message.data) {
    if (messageString != "")
      messageString += ", "
    messageString += key + ":" + message.data[key];
  }
  console.log("Message received: " + messageString);

  // Pop up a notification to show the GCM message.
  chrome.notifications.create(getNotificationId(), {
    title: 'GCM Message',
    iconUrl: 'gcm_128.png',
    type: 'basic',
    message: messageString
  }, function() {});
}


function firstTimeRegistertion() {
  chrome.storage.local.get("registered", function(result) {
    // If already registered, bail out.
    if (result["registered"])
      return;
      
    chrome.app.window.create(
      "register.html",
      {  width: 500,
         height: 400,
         frame: 'chrome'
      },
      function(appWin) {}
    );
  });
}

// Set up a listener for GCM message event.
chrome.gcm.onMessage.addListener(messageReceived);

// Set up listeners to trigger the first time registration.
chrome.runtime.onInstalled.addListener(firstTimeRegistertion);
chrome.runtime.onStartup.addListener(firstTimeRegistertion);
