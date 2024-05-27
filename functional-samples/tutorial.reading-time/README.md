# Tutorial: Run scripts on every page

This sample demonstrates how to run scripts on any Chrome extension and Chrome Web Store documentation page using an extension called _Reading Time_.

## Overview

This sample demonstrates how developers can use content scripts which employ Document Object Models to read and change the content of a page. In this instance, the extension checks to find an article element, counts all the words inside of it, and then creates a paragraph that estimates the total reading time for that article.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Navigate to a Chrome extension or Chrome Webstore documentation page with an article element. [Here](https://developer.chrome.com/docs/webstore/publish) is an example of a webpage with an article element.
4. The extension will provide an estimated reading time for the text in that article element. Here is the [link](https://developer.chrome.com/docs/extensions/get-started/tutorial/scripts-on-every-tab) for the full instructions.
