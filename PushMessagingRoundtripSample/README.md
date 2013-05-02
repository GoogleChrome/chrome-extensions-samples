# Push Messaging Roundtrip Sample App

Sample that shows how to use the [Push Messaging
API](http://developer.chrome.com/trunk/apps/pushMessaging.html) in an app.

Normally we don't expect you to send push messages from JS code, we normally
expect that you will want to write a server which does the sending, but this app may
help you with debugging your client app, understanding the whole flow of the
push messaging scenario, and testing push messaging end to end with your
credentials.

This app brings up a small window that will send a push message through
the push messaging server when you press its button.  The message should
appear as a notification on the screen (it will dissapear after a few
seconds, and you can look for it in the notification center on Mac or Win).

You will need to make your own copy of this app, and upload it to the
Chrome Web Store to get an extension id. Once you have that, you will need
to get oauth credentials for the same account you used to upload the app.

Once you have the credentials (instructions below), edit the
push_messaging_roundtrip_sample.js
file on your machine. You can then go to the chrome://extensions page and
load it as an unpacked extension. You can debug it by right clicking on the
page and using "inspect".

See the Push Messaging documentation for where to get the values to use for
the clientId, clientSecret, and refreshToken.
Server side docs are located here:
http://developer.chrome.com/apps/cloudMessaging.html
Client side docs are located here:
http://developer.chrome.com/apps/pushMessaging.html


Most of the relevant code for this sample is in push_messaging_roundtrip_sample.js.
We've commented it heavily, to explain what is going on and what you need to do
to write your client code.

## APIs

* [Push Messaging API](http://developer.chrome.com/trunk/apps/pushMessaging.html)
*[GCM for Chrome serverf API](http://developer.chrome.com/trunk/apps/cloudMessaging.html)