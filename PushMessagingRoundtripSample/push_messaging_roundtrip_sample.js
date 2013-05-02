// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This app brings up a small window that will send a push message through
// the push messaging server when you press its button.  The message should
// appear as a notification on the screen (it will dissapear after a few
// seconds, and you can look for it in the notification center on Mac or Win).

// Normally, you will write two separate apps, one server app to send push
// messages, and a client app to recieve it.  This app does both the sending
// and receiving so you can watch the system work end to end.

// You will need to make your own copy of this app, and upload it to the
// Chrome Web Store to get an extension id. Once you have that, you will need
// to get oauth credentials for the same account you used to upload the app.

// Once you have the credentials (instructions below), edit this .js
// file on your machine. You can then go to the chrome://extensions page and
// load it as an unpacked extension. You can debug it by right clicking on the
// page and using "inspect".

// See the Push Messaging documentation for where to get the values to use for
// the clientId, clientSecret, and refreshToken.
// Server side docs are located here:
// http://developer.chrome.com/apps/cloudMessaging.html
// Client side docs are located here:
// http://developer.chrome.com/apps/pushMessaging.html


// You need to get and fill in your own credentials below.
var clientId = '<put your client ID here>';
var clientSecret =  '<put your client secret here>';
var refreshToken = '<put your refresh token here>';
const testSubchannelId = 1;
const randomPayload = String(Math.random());

// Register with the Push Messaging system for the Push Message.
chrome.pushMessaging.onMessage.addListener(reportDetails);

// Log and display the results when a push message arrives.
function reportDetails(details) {
  console.log("push message arrived, round trip complete!");
  console.log("subchannel - " + details.subchannelId);
  console.log("payload - " +  details.payload);

  // Show a notification with these details.
  showPushMessage(details.payload, details.subChannel);
}

// When a Push Message arrives, show it as a text notification (toast).
function showPushMessage(payload, subChannel) {
  var notification = window.webkitNotifications.createNotification(
      'icon.png', 'Push Message',
      "Push message for you! " +
      payload +" [" + subChannel + "]");
  notification.show();
}

// Once we get the channel ID, start a push.
function getChannelIdCallback(details) {
  console.log("channelId callback arrived, channel Id is '" +
              details.channelId + "'");
  var channelId = details.channelId;
  getAccessToken(channelId);
  showChannelId(channelId);
}

// If the manual button is pushed, start a push.
function buttonHandler() {
  console.log("'push via server' button pressed");
  // Send a push message to the canary test using my test account.
  chrome.pushMessaging.getChannelId(getChannelIdCallback);
  // When the callback arrives, we then make an XHR to get the access token,
  // and when that arrives, we make a second XHR to send the push message.
}

// Hook up the sendpush button on the HTML page to send a push.
function registerButtonListener() {;
  var button = document.getElementById('sendpush');
  button.onclick = buttonHandler;
}

// This function will go to the server and ask it to send us an access token.
// When we get the access token in the callback we will continue with a second
// XHR to send the message.
function getAccessToken(channelId) {
  var tokenRequest = new XMLHttpRequest();
  var tokenUrl = 'https://accounts.google.com/o/oauth2/token';
  tokenRequest.open('POST', tokenUrl, true);
  tokenRequest.setRequestHeader('Content-Type',
                                'application/x-www-form-urlencoded');
  var tokenData = 'client_secret=' + clientSecret + '&' +
                  'grant_type=refresh_token&' +
                  'refresh_token=' + refreshToken + '&' +
                  'client_id=' + clientId;
  tokenRequest.onreadystatechange = function (theEvent) {
    if (tokenRequest.readyState === 4) {
      if (tokenRequest.status === 200) {
        console.log("First XHR returned, " + tokenRequest.response);

        // Parse the access token out of the XHR message.
        var parsedResponse = JSON.parse(tokenRequest.response);
        var accessToken = parsedResponse.access_token;

        askServerToSendPushMessageWithToken(accessToken, channelId);
      } else {
        console.log('Error sending first XHR, status is ' +
                    tokenRequest.statusText);
      }
    }
  }

  // Send the XHR with the data we need.
  console.log("Sending first XHR, data is " + tokenData);
  tokenRequest.send(tokenData);
}

// Now that we have an access token, use it to send the message.
function askServerToSendPushMessageWithToken(accessToken, channelId) {
  // Setup the push request, using the access token we just got.

  var channelNum = 1;
  var pushURL ='https://www.googleapis.com/gcm_for_chrome/v1/messages';
  var pushData = '{"channelId": "' + channelId + '", ' +
                 '"subchannelId": "'  + channelNum +  '", ' +
                 '"payload": "Hello push messaging!"}';
  var pushRequest = new XMLHttpRequest();
  pushRequest.open('POST', pushURL, true);
  // Set the headers for the push request, including the parsed accessToken.
  pushRequest.setRequestHeader('Authorization', 'Bearer ' + accessToken);
  pushRequest.setRequestHeader('Content-Type', 'application/json');
  pushRequest.onreadystatechange = function (theEvent) {
    if (pushRequest.readyState === 4) {
      if (pushRequest.status === 200) {
        console.log("second XHR returned, " + pushRequest.response);
      } else {
        console.log('Error sending second XHR, status is ' +
                     pushRequest.statusText + ' body is ' +
                     pushRequest.response);
      }
    }
  }

  // Send the push request.
  console.log("sending second XHR, data is " + pushData);
  pushRequest.send(pushData);

}

// Pop up when the channelId arrives to show the channel ID that is registered
// for debugging purposes.
function showChannelId(channelId) {

  var break_node = document.createElement("br");
  document.body.appendChild(break_node);

  // Display the channel ID if we have one, blank if getChannelId failed.
  var channel_id_node = document.createElement("p");
  channel_id_node.textContent = "channel_id is " + channelId;
  document.body.appendChild(channel_id_node);
  document.body.appendChild(break_node);
}

// Register for the button press on the web page, and send a push if pressed.
window.addEventListener('load', registerButtonListener, false);
