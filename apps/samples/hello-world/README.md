<a target="_blank" href="https://chrome.google.com/webstore/detail/nmfpplkdkcbhediajmbhljkafnlahcda">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Hello World

This is a starter application. It contains a basic manifest file with no
additional permissions. The manifest denotes a background script, main.js,
detailed below:

```javascript
chrome.app.runtime.onLaunched.addListener(function() {
  // Center window on screen.
  var screenWidth = screen.availWidth;
  var screenHeight = screen.availHeight;
  var width = 500;
  var height = 300;

  chrome.app.window.create('index.html', {
    id: "helloWorldID",
    outerBounds: {
      width: width,
      height: height,
      left: Math.round((screenWidth-width)/2),
      top: Math.round((screenHeight-height)/2)
    }
  });
});
```

This simply waits for the launch event for the application (`chrome.app.runtime.onLaunched.addListener`)
and, at that point, creates a window using a basic HTML page, index.html, as the source.

## Resources

* [Runtime](http://developer.chrome.com/apps/app.runtime.html)
* [Window](http://developer.chrome.com/apps/app.window.html)
     
## Screenshot
![screenshot](/samples/hello-world/assets/screenshot_1280_800.png)

