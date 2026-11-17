This recipe shows how to write a string to the system clipboard from an extension service worker. It tries to use `navigator.clipboard`, with a fallback to an [Offscreen document][1] for older versions of Chrome.

## Context

Starting in Chrome 157, extension service workers with the `"clipboardWrite"` permission can write to the system clipboard directly using `navigator.clipboard` (see [MDN's docs][0]).

Prior to Chrome 157, neither `navigator.clipboard` nor `document.execCommand()` was exposed to JavaScript workers. To support those versions (or formats like `text/html` that require a DOM), `addToClipboard()` falls back to the Offscreen API to write to the clipboard from a background DOM document.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension][2].
3. Open the Extension menu and click the extension named "Clipboard Writing".

You will now have "Hello, World!" on your system clipboard.

[0]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
[1]: https://developer.chrome.com/docs/extensions/reference/offscreen/
[2]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
