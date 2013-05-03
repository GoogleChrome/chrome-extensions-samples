# Push Sample App

Sample that shows how to use the [Push Messaging
API](http://developer.chrome.com/trunk/apps/pushMessaging.html) in an app.

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

Here is a sample curl script - you will need to replace the clientId,
clientSecret, and refreshToken with the ones you get following the instructions
below, and replace the channel ID with the channelID shown in the UI once you
launch the sample app.

 # Use our refresh token to get an access token, put it into an environment
 # variable called accesstoken after parsing the token out of the http output.
accesstoken=(`curl -s https://accounts.google.com/o/oauth2/token -d "client_secret=<your client secret here>&grant_type=refresh_token&refresh_token=<your refresh token here>&client_id=<your client id here>" | grep "access_token" | awk -F\" '{print $4}'`)

 # Send the push message using the refresh token we obtained for staging.
curl -s -H "Authorization: Bearer $accesstoken" -H "Content-Type: application/json" https://www.googleapis.com/gcm_for_chrome/v1/messages -d "{'channelId': '<insert channel id here>', 'subchannelId': '0', 'payload': 'Hello push messaging!'}"

## APIs

* [Push Messaging API](http://developer.chrome.com/trunk/apps/pushMessaging.html)
*[GCM for Chrome serverf API](http://developer.chrome.com/trunk/apps/cloudMessaging.html)