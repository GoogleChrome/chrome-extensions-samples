# Opening the side panel through a user interaction

This example demonstrates using [`chrome.sidePanel.open()`](https://developer.chrome.com/docs/extensions/reference/sidePanel/#method-open) to open a global side panel through a context menu click and a tab-specific side panel by clicking a button in an extension page or a button click injected by a content script. This feature will be available starting **Chrome 116**.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).

### Test with a context menu

1. Navigate to any page, like [example.com](http://example.com/).
2. Right-click on any word.
3. Choose the context menu "Open side panel".

### Test in an extension page

1. The extension page will open when you install the extension.
2. Click on the "Open side panel" button.

### Test by clicking on an injected element

1. Navigate to [google.com](http://www.google.com/).
2. Scroll to the very bottom of the page.
3. Click on the "Open side panel" button.
