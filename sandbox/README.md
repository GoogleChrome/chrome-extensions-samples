# Sandbox

This sample creates a sandboxed iframe (`sandbox.html`) to which the main page (`mainpage.html`)
passes a counter variable. The sandboxed page uses the
[Handlebars template library](http://handlebarsjs.com/) to evaluate and compose a message
using the counter variable which is then passed back to the main page for rendering.

The default packaged app Content Security Policy (CSP) value
[disallows](http://developer.chrome.com/trunk/apps/app_csp.html) the use of
`eval()` or `new Function()` (or variants like `Function.apply()`) so using a
sandbox is necessary for this process. To enable sandboxing in your app you
add the `sandbox` property to your app's [manifest file](http://developer.chrome.com/trunk/apps/manifest.html#sandbox).

See more info on [using eval safely in packaged apps](http://developer.chrome.com/trunk/apps/sandboxingEval.html).

## APIs

* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
