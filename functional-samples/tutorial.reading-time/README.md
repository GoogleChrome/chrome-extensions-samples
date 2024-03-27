# Reading time

Extension from the [Run scripts on every page](https://developer.chrome.com/docs/extensions/get-started/tutorial/scripts-on-every-tab) 'Get Started' article on the extensions docs.

This extension adds reading time information under an article in the documentation for extensions or webstore.

This sample demonstrates the use of content scripts to modify the content of a page. The content script is associated with a particular url pattern listed in `manifest.json`. The script only acts on websites whose url matches the specified pattern. In this case, the pattern matches for docs articles of extensions or webstore.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Visit an article on the docs for extensions or the webstore ([Extensions Docs](https://developer.chrome.com/docs/extensions/) or [Chrome Webstore Docs](https://developer.chrome.com/docs/webstore/)).
4. Find the Reading time information right under the article title (ensure that the extension is turned on).
