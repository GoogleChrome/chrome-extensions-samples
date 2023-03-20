<a target="_blank" href="https://chrome.google.com/webstore/detail/ebcgmmcbgnpoclkoibogeiokfdmjbbob">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>

# One time payments & free trials in Chrome Apps

If you choose to charge users for your Chrome App, there are several options
available to you. The Chrome Web Store has a built-in
[one-time payment system](https://developers.google.com/chrome/web-store/docs/payments-otp)
called Chrome Web Store Payments.  With one-time payments, you can also
offer a free trial experience for your users.

### Note:
The version that is published in the Chrome Web Store is not available for sale! This is to prevent people from accidentally purchasing a sample.  When installed, the user will be issued with a FREE_TRIAL license.  If you want to see the end to end flow, complete with the ability to purchase the app, you'll need to publish it in the store yourself and enable one time payments.  See the [documentation](https://developers.google.com/chrome/web-store/docs/payments-otp#using-otps) for full details.

To test with the version that is in the Chrome Web Store, you'll need
to add the the key below to your manifest:

```"key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtqhlRmNTTzJXvfYcLEW9sTzOJzDxJr5M80XgolHc1EYdvjdg1/e4+fPadq3vAueArzwvEtFji2Ax4Aqo99kA1qYyw9ji8RdlUArvJCTIq/7xPMoMPWHCb3wPfZ7IYV4U6h841dUjrOng7yxN9RIYSLHPpqQG0tBSh3sx7pxjYWx6DxhxOlP9BAQ9W8McSaoI8Wy/4hCJb0k6hkGrD1q7mQIWODg7aF03+LvWuF+GNZJfVFU37w6IFo2bcmfJugW/Lu4oG4eYuYziWFXNfgnwaHyrA5MLPrQJ3jZKiETx1AzCClAyYKafkwKEXXhb0mA1H/fJf1ePfMWjT4Yj0E8SWwIDAQAB"```

## APIs
* [Identity](http://developer.chrome.com/apps/identity.html)

## Screenshot
![screenshot](/_archive/apps/samples/one-time-payment/assets/screenshot_1280_800.png)
