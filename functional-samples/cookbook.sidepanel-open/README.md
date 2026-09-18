# Opening the side panel through a user interaction

This example demonstrates using [`chrome.sidePanel.open()`](https://developer.chrome.com/docs/extensions/reference/sidePanel/#method-open) to open a global side panel through a context menu click and a tab-specific side panel by clicking a button on an extension page or by clicking a button injected via a content script. This feature will be available starting **Chrome 116**.

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
3. You should see a button labeled "Click to open side panel" (this is injected by the content script).
4. Click on the button.
5. The side panel should open, showing the content from `sidepanel-tab.html`. This side panel is tab-specific and will remain open only on the current tab.

### Key Changes:

- **Injected Button on Google**: The extension now injects a button labeled "Click to open side panel" at the bottom of the page on `google.com`. Clicking this button opens a tab-specific side panel with the content from `sidepanel-tab.html`.
- **Tab-Specific Side Panel**: The side panel is now tab-specific when triggered by the injected button on a web page, ensuring it only opens on the current tab, rather than globally.

## Permissions

The extension requires the following permissions:
- `sidePanel`: To interact with Chrome’s side panel API.
- `contextMenus`: To create a context menu item for opening the global side panel.

## Notes

This extension utilizes the new Chrome feature, available starting Chrome 116, that allows opening a side panel through a user interaction.
