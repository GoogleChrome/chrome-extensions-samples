## Fetching a favicon in a content script

This example fetches the favicon from www.google.com and inserts it at the top left of every page.

Note: This extension does not work on `chrome://extensions`.

## Testing the extension

1. Follow the instructions to load an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
2. Navigate to [www.example.com](https://www.example.com/).

It should look like this:

![Content script using the Favicon API](https://wd.imgix.net/image/BhuKGJaIeLNPW9ehns59NfwqKxF2/3Q1glvnzbWhraXRtnGOy.png)