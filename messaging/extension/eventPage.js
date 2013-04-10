var blacklistedIds = ["none"];

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (sender.id in blacklistedIds) {
      sendResponse({"result":"sorry, could not process your message"});
      return;  // don't allow this extension access
    } else if (request.myCustomMessage) {
      var notification = webkitNotifications.createNotification( 
          null,   // icon
          'Got message from '+sender.id,  // notification title
          request.myCustomMessage  // notification body text
        );
      notification.show();
      sendResponse({"result":"Ok, got your message"});
    } else {
      sendResponse({"result":"Ops, I don't understand this message"});
    }
  });

