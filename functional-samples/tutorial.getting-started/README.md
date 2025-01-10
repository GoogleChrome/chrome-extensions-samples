# Getting Started With Google Chrome Extensions

This is a extension used in the [Debugging extensions][1] tutorial. It changes the html body background color of active tab.
The purpose of this extension is to demonstrate how to create a simple Chrome extension that uses the `default_popup`, `options_page` and `service_worker` manifest keys and `storage` and `tabs` APIs.

 ## Running This Extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension][2].
3. Go to https://developer.chrome.com/docs/extensions/get-started/tutorial/debug or any web page.
4. Click the extension icon in the Chrome toolbar, then click the three dots next to the "Getting Started Example" extension and select "Options".
5. On the Options page, choose a color.
6. Afterward, click the extension icon again, and the page's background color will change when you click the button in extension popup.
 
[1]: https://developer.chrome.com/docs/extensions/get-started/tutorial/debug
[2]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked