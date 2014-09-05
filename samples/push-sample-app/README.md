<a target="_blank" href="https://chrome.google.com/webstore/detail/padhfginpopnempbenndlhnppcigcgmn">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Push Sample App

Sample that shows how to use the [Push Messaging
API](http://developer.chrome.com/apps/pushMessaging.html) in an app.

How to install on your local machine:

You can either install this from the Chrome Web Store at https://chrome.google.com/webstore/detail/push-messaging-sample-cli/bafimiidcfafikaonocgmmcpbbhfjjik
or put this into a directory on your machine, and go to chrome://extensions,
click on the "Load unpacked extension..." button, and choose the directory where
you downloaded this sample.

That will install the sample app, you can launch it from the new tab page.
Choose the apps view at the bottom if it is not already selected, and click on
the Push Messaging Sample app.  It will launch an app which registers for and
receives push messages.  Now you can use this to test recieving messages from
the push messaging server you write.  You can also test it with a curl script
which sends push messages.

Most of the relevant code for this sample is in background.js.  We've commented
it heavily, to explain what is going on and what you need to do to write your
client code.

Here is a sample curl script to send a push message - you will need to replace
the Access token with the one you get by following the
[instructions](https://developer.chrome.com/apps/cloudMessagingV1#checklist),
and replace the channel ID with the channelID shown in the UI once you launch
the sample app.

    curl https://accounts.google.com/o/oauth2/token \
    -H "Authorization: Bearer <insert accessToken>" \
    -H "Content-Type: application/json" \
    -d "{'channelId': '<insert channelId>', 'subchannelId': '0', 'payload': 'Hello'}"

## APIs

* [Push Messaging API](http://developer.chrome.com/apps/pushMessaging.html)
* [Google Cloud Messaging for Chrome V1](https://developer.chrome.com/apps/cloudMessagingV1)

## Screenshot
![screenshot](https://raw.github.com/GoogleChrome/chrome-app-samples/master/push-sample-app/assets/screenshot_1280_800.png)

