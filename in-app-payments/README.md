<a target="_blank" href="https://chrome.google.com/webstore/detail/onjblnjcaogpefajepegjnajhkehfmna">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


## Overview of Chrome In App Payments API

You can use the Chrome In-App Payments API (Chrome IAP API) to sell digital and virtual goods within a Chrome App. When you use the Chrome IAP API, the Chrome In-App Payments Service (embedded in Chrome) communicates with the Google Wallet servers and handles all the required checkout details so your app does not have to process any financial transactions. The actual integration work to enable in app payments is similar to using the [Google Wallet digital goods API](https://developers.google.com/commerce/wallet/digital/docs/) for websites except that the Chrome IAP API requires you to embed a piece of JavaScript ([buy.js](https://raw.github.com/GoogleChrome/chrome-app-samples/master/in-app-payments/buy.js)) within your app to trigger the payment flow.

## Sample app
Here’s a sample app that calls into the Chrome IAP API and provides options to trigger payments via the sandbox server as well as the production server:

https://github.com/GoogleChrome/chrome-app-samples/tree/master/in-app-payments

The above sample app has been published on the webstore - you can install it on Chrome Canary or Dev channel and try out the in-app-payment flows:

https://chrome.google.com/webstore/detail/moldiohggmfllblgmikpeoagipenlcae

When testing with the sandbox, you can use the following credit card numbers, which pass basic checks by the Google Wallet for digital goods system:

https://developers.google.com/commerce/wallet/digital/docs/testing

     
## Screenshot
![screenshot](https://raw.github.com/GoogleChrome/chrome-app-samples/master/in-app-payments/assets/screenshot_1280_800.png)

