# Hello World

This is the most basic application that one can create:

```javascript
// Main.js
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html',
    {width: 500, height: 309});
});
```

## APIs

* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)

---
Last updated: 2012-08-14 by miu
