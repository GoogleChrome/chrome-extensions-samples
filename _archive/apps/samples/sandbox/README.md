<a target="_blank" href="https://chrome.google.com/webstore/detail/ipchbpppeafbpnmnjbkljpfhkkiaeikd">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Sandbox

This sample creates a sandboxed iframe (`sandbox.html`) to which the main page (`mainpage.html`)
passes a counter variable. The sandboxed page uses the
[Handlebars template library](http://handlebarsjs.com/) to evaluate and compose a message
using the counter variable which is then passed back to the main page for rendering.

The default packaged app Content Security Policy (CSP) value
[disallows](https://developer.chrome.com/docs/apps/contentSecurityPolicy/) the use of
`eval()` or `new Function()` (or variants like `Function.apply()`) so using a
sandbox is necessary for this process. To enable sandboxing in your app you
add the `sandbox` property to your app's [manifest file](http://developer.chrome.com/apps/manifest#sandbox).

See more info on [using eval safely in packaged apps](http://developer.chrome.com/apps/sandboxingEval).

## APIs

* [Runtime](https://developer.chrome.com/docs/extensions/reference/app_runtime)

## Screenshot
![screenshot](/_archive/apps/samples/sandbox/assets/screenshot_1280_800.png)

