This recipe shows how to write a string to the system clipboard using the [Offscreen document][1].

## Context

As of January 2023, the web platform has two ways to interact with the clipboard: `document.execCommand()` and `navigator.clipboard` (see [MDN's docs][0]). Unfortunately, neither of these APIs are exposed to JavaScript workers. This means that in order for an extension to read from or write values to the system clipboard, the extension _must_ do so in a web page. Enter the Offscreen API. This API was introduced to give extension developers an unobtrusive way to use DOM APIs in the background.

In the future, the Chrome team is planning to add clipboard support directly to extension service workers. As such, this recipe is written to make it as easy as possible to replace `addToClipboard()`'s offscreen document-based implementation with one that directly uses the appropriate clipboard API.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension][2].
3. Open the Extension menu and click the extension named "Offscreen API - Clipboard".

You will now have "Hello, World!" on your system clipboard.

[0]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
[1]: https://developer.chrome.com/docs/extensions/reference/offscreen/
[2]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
