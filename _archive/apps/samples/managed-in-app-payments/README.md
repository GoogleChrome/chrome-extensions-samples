# Managed In-App Payments with Google Wallet and the Chrome Web Store API

You can use [managed in-app payments with Google Wallet and the Chrome Web Store API](https://developer.chrome.com/webstore/payments-iap) to sell virtual
goods within a Chrome App. When you use managed in-app payments, the
Chrome In-App Payments Service (embedded in Chrome) communicates with:
 * The Chrome Web Store to get the list of available products, including:
   * Items available for purchase
   * Items purchased by the user
 * The Google Wallet servers to handle all the required checkout details.

This means that you can easily manage your virtual good inventory and licensing through the Chrome Web Store Developer Dashboard, and the Chrome Web Store will take care of the nitty gritty details, including financial transaction processing.

The actual integration work to enable managed in-app payments is similar to using the [Google Wallet for Digital Goods API](https://web.archive.org/web/20130308145345/https://developers.google.com/commerce/wallet/digital/docs/) (now deprecated), except that managed in-app payments require you to embed a piece of JavaScript ([buy.js](https://raw.githubusercontent.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/samples/managed-in-app-payments/scripts/buy.js)) within your app to trigger the payment flow.
