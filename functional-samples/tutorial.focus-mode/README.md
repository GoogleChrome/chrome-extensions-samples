# Focus Mode

This example demonstrates how to use the [Scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting) to inject and remove CSS on demand, enabling a distraction-free reading experience on Chrome's documentation pages.

## Overview

The extension adds a focus mode toggle for Chrome's Extensions and Chrome Web Store documentation. When activated, it hides navigation elements and other distractions, centering the article content for easier reading.

## Implementation Notes

The extension uses the following Chrome APIs:

- `chrome.scripting.insertCSS()` - Injects the focus mode stylesheet when enabled
- `chrome.scripting.removeCSS()` - Removes the stylesheet when disabled
- `chrome.action` - Displays an "ON"/"OFF" badge indicating the current state
- `activeTab` permission - Allows the extension to modify only the current tab

The focus mode can be toggled by:

- Clicking the extension icon
- Using the keyboard shortcut (Ctrl+B on Windows/Linux, Command+B on Mac)

The toggle state is maintained per-tab, allowing different tabs to have different focus mode states.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Navigate to https://developer.chrome.com/docs/extensions/ or https://developer.chrome.com/docs/webstore/.
4. Click the extension icon or press Ctrl+B (Command+B on Mac) to toggle focus mode.
