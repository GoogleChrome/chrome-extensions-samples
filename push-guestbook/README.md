# Push Messaging Guestbook

Sample that shows how to use the [Push Messaging
API](http://developer.chrome.com/trunk/apps/pushMessaging.html) in an app.

How to install on your local machine:

* Download the [Google App Engine SDK for
  Python](https://developers.google.com/appengine/downloads#Google_App_Engine_SDK_for_Python).
* Ensure that <code>dev\_appserver.py</code> is in your PATH
* Go to the [Developer Console](https://code.google.com/apis/console/), and request a "Client ID for Web Applications"
  using the "API Access" nav bar item, click on "Create an OAuth2 client ID".
* Use the "Web Application" type in the Create Client ID dialog.
* Use "localhost" for the URL.
* Click on "Edit settings" to edit the redirect URIs.
* Add <code>http://localhost:8080/oauth2callback</code> to the list of Redirect
  URIs for your Client ID (yes, http, not https for the sample.)
* Download JSON for your client ID, and save it in the path
  <code>$PROJECT\_ROOT/guestbook-srv/client\_secrets.json</code>.
* Click on the "Services" item on the left nav bar.
* Scroll down to "Google Cloud Messaging for Chrome", and turn it on.

## How to serve from your local machine: ##

    ~ cd $PROJECT_ROOT/guestbook-srv
    ~ dev_appserver.py .

## How to enable push messaging:

* Upload the app in <code>$PROJECT\_ROOT/guestbook-app</code> to the Chrome Web Store.  
** When you go to the Chrome Web Store, Click the "gear" icon, and choose "Developer Dashboard".
** click "Add new item"
* Download he app back to your browser.
* Don't launch the client app yet!  Wait until the server is running, and you have navigated to localhost:8080/startpush and authorized your appserver to send messages.  The client registers with the server on startup.  If you do end up starting the client app too early, you can try first killling it from the chrome://extensions page, and if that doesn't work, you can restart the dev_appserver with the --clear_datastore argument.
* Navigate to <code>http://localhost:8080/startpush</code> and login with the account with push.  You should only have to do this once, not every time.
* Launch the push messaging sample app. It should have a message like "The last Guestbook message was "..."
* Send push messages <code>http://localhost:8080</code> by signing the guestbook web page.  After you leave a message and press sign, the server will send the push message.
* You should now see the payload of the push message appear in the push guestbook app.

## APIs

* [Push Messaging API](http://developer.chrome.com/trunk/apps/pushMessaging.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
