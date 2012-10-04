# Analytics

This example demonstrates how to include support for Google Analytics in your
packaged application. Since the Google Analytics resources reside on a different domain to your
application a meta tag is set in the `embedded_ga_host.html` file denoting the
appropriate access that is required. The `embedded_ga_host.html` file is also
placed in a [sandbox](http://developer.chrome.com/trunk/apps/manifest.html#sandbox).

*Please note: You will need to modify ga_details.js to include real Google
Analytics credentials.*

## Resources

* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
* [CSP](http://developer.chrome.com/trunk/apps/app_csp.html)
* [Sandbox](http://developer.chrome.com/trunk/apps/manifest.html#sandbox)

