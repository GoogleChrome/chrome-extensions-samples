# Hello World

This is a starter application. It contains a basic manifest file with no
additional permissions. The manifest denotes a background script, main.js,
detailed below:

```javascript
// Main.js
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html',
    {width: 500, height: 309});
});
```

This simply waits for the launch event for the application (`chrome.app.runtime.onLaunched.addListener`)
and, at that point, creates a window using a basic HTML page, index.html, as the source.

## Resources

* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)

---
Last updated: 2012-08-29 by paullewis
