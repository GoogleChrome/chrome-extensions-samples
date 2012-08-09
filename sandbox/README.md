# Sandbox

This sample creates a sandboxed iframe (`sandbox.html`) to which the main page (`mainpage.html`)
passes a counter variable. The sandboxed page uses handlebars to evaluate and compose a message
using the counter variable which is then passed back to the main page for rendering.

[CSP](http://developer.chrome.com/trunk/apps/app_csp.html) disallows the use
of `eval` or `new Function` (or variations like Function.apply) so using a
sandbox is necessary for this process. To enable sandboxing in your app you
add the `sandbox` property to your app's [manifest file](http://code.google.com/chrome/extensions/manifest.html#sandbox).

## Permissions

* Experimental

[See more on permissions](http://code.google.com/chrome/extensions/manifest.html#permissions)

## APIs

* [Experimental App](http://developer.chrome.com/trunk/apps/experimental.app.html)

---
Last updated: 2012-08-09 by paullewis
