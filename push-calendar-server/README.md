# CalendarPushSample

This sample shows a matched Push Messaging client and server.  The server is a
fair amount of work to set up, but you can easily read the sample to see how to
write your own Push Messaging server in Java.

The client is a chrome app that will recieve push messages and display them as
notifications.

You can use the push messaging sample app as a client.  You can either get the sample or install it from the chrome web store: https://chrome.google.com/webstore/detail/push-messaging-sample-cli/bafimiidcfafikaonocgmmcpbbhfjjik

To run the client, you need to go to chrome://extensions, click on the
"Load Unpacked Extension..." button, and choose the directory where you
downloaded the client file for this sample.  This will install the app into
chrome.  You can run the app by going to the new tab page, selecting the apps
view, and clicking on the app.

To set up the server, you will need two sets of credentials.  The first set is
for accessing calendar, and you will place these into a text file on the server
called client_secrets.json.  The "instrutions.html" file in the project will
tell you how to get the calendar credentials.
TODO: See if we can merge them into a single set of credentials, in a single file.

The second set of credentials go into the "secrets.txt" file.  The instrutions
for the push messaging server will tell you how to get these.

This is an eclipse project that requires the maven and mercurial plugins.
You will need to download the java libraries for connecting to Goolge Calendar.

You need to install all the google calendar instructions and follow them too.

You know this is really getting complicated - I need to make a single set of
instructions with everything, URLs, where to download, etc, and I should think
hard if it is even worth publishing this sample.