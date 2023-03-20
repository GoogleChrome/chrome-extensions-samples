<a target="_blank" href="https://chrome.google.com/webstore/detail/gaaeficfcmngmogaejhikdnkdijlpgec">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Sandbox

This sample creates a window containing a sandboxed iframe (`sandbox.html`).
The sandbox uses `eval()` function to write some HTML to its own document.

The default packaged app Content Security Policy (CSP) value
[disallows](https://developer.chrome.com/docs/apps/contentSecurityPolicy/) the use of
`eval()` or `new Function()` (or variants like `Function.apply()`) so using a
sandbox is necessary for this process. To enable sandboxing in your app you
add the `sandbox` property to your app's [manifest file](http://developer.chrome.com/apps/manifest#sandbox).

See more info on [using eval safely in packaged apps](http://developer.chrome.com/apps/sandboxingEval).

## APIs

* [Runtime](https://developer.chrome.com/docs/extensions/reference/app_runtime/)


## Screenshot
![screenshot](/_archive/apps/samples/sandboxed-content/assets/screenshot_1280_800.png)

