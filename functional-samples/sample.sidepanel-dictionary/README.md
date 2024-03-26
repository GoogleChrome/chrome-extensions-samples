# Dictionary Side panel example

This sample demonstrates how to use the [Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/) to display word definitions in a side panel when users right-click on a word.

## Overview

When users right-click on a word, the extension sends the selected word to the side panel, allowing them to view its definition. The extension utilizes` chrome.storage.session` to store the selected word, ensuring that it is accessible even if the side panel is not open at the moment of selection.

## Implementation Notes

When the user selects a word, we need to send it to the side panel, but that
may not be open yet. To handle this we store the word in
`chrome.storage.session`, which results in the following:

- If the side panel is already open, the `storage.session.onChanged` event
  will fire in the side panel.
- Otherwise, the value will be loaded from storage when the side panel opens.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Go to https://developer.chrome.com/docs/extensions/
4. Right-click on the "Extensions" word.
5. Choose the "Define" context menu
