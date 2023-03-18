<a target="_blank" href="https://chrome.google.com/webstore/detail/ajjcafkkflbcealbcfjajolnkogffgcb">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Hello World storage.sync

Use chrome.storage.sync to share small chunks of data among all of your Chrome devices. To test, open this app in two different devices, both signed in with the same user.

Important: needs "key" in manifest.json to support testing outside of CWS, so that sync storage is shared among different instances.


    // app.js
    chrome.storage.sync.set({"myValue": newValue}, mycallback);
    ...
    chrome.storage.onChanged.addListener(
      function(changes, namespace) {
        // do something
      }
    );
    ...
    chrome.storage.sync.get("myValue",
      function(val) {
        // do something
      }
    );

## APIs

* [Storage sync](http://developer.chrome.com/extensions/storage)

## Screenshot
![screenshot](/_archive/apps/samples/hello-world-sync/assets/screenshot_1280_800.png)

