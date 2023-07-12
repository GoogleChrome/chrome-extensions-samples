# Site-specific side panel example

This example demonstrates using [`chrome.sidePanel.open()`](https://developer.chrome.com/docs/extensions/reference/sidePanel/#method-open) to open a global side panel across all tabs via a context menu and a tab-specific side panel using a keyboard shortcut in the current tab.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).

### Test the global panel

1. Navigate to any page, like [example.com](http://example.com/)
2. Right-click on any word.
3. Choose the context menu "Open side panel"

### Test the tab-specific panel

1. Navigate to any page, like [example.com](http://example.com/)
2. Press the shortcut **Ctrl+Shift+Y** on Windows or **Command+Shift+Y** on macOS.
