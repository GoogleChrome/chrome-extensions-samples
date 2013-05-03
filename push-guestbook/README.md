# Push Messaging Guestbook

Sample that shows how to use the [Push Messaging
API](http://developer.chrome.com/trunk/apps/pushMessaging.html) in an app.

How to install on your local machine:

* Download the [Google App Engine SDK for
  Python](https://developers.google.com/appengine/downloads#Google_App_Engine_SDK_for_Python).
* Ensure that <code>dev\_appserver.py</code> is in your PATH
* Go to the [Developer Console](https://code.google.com/apis/console/), and request a "Client ID for Web Applications"
  under the API Access tab.
* Add <code>http://localhost:8080/oauth2callback</code> to the list of Redirect
  URIs for your Client ID
* Download JSON for your client ID, and save it in the path
  <code>$PROJECT\_ROOT/guestbook-srv/client\_secrets.json</code>.

## How to serve from your local machine: ##

    ~ cd $PROJECT_ROOT/guestbook-srv
    ~ dev_appserver.py .

## How to enable push messaging:

* Upload the app in <code>$PROJECT\_ROOT/guestbook-app</code> to the Chrome Web Store.
* ??? (get on the whitelist for sending push messages)
* Download it back to your browser, and click the icon to open the main window.
  it should have a message like "The last Guestbook message was"
* Navigate to <code>http://localhost:8080/startpush</code> and login with the account with push
  message permission
* Begin sending push messages by signing the guestbook at <code>http://localhost:8080</code>

## APIs

* [Push Messaging API](http://developer.chrome.com/trunk/apps/pushMessaging.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
