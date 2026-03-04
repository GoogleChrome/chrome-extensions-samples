# Open Extension API Reference

This example demonstrates how to use the [Omnibox API](https://developer.chrome.com/docs/extensions/reference/api/omnibox) to quickly navigate to Chrome extension API reference pages directly from the address bar.

## Overview

The extension registers the keyword "api" in Chrome's omnibox. When users type "api" followed by a space, they can search for any Chrome extension API and navigate directly to its documentation page.

## Implementation Notes

The extension uses several Chrome APIs:

- `chrome.omnibox` - Registers the "api" keyword and handles input/selection events
- `chrome.storage.local` - Stores recent search history to provide personalized suggestions
- `chrome.alarms` - Used for periodic tip fetching from an external service
- Content script - Runs on the API reference pages

When the user types in the omnibox:

1. `onInputChanged` provides API suggestions based on user input and search history
2. `onInputEntered` opens the selected API's reference page in a new tab
3. The most recent searches (up to 4) are saved for future suggestions

The service worker is organized into modules:

- `sw-omnibox.js` - Handles omnibox events and navigation
- `sw-suggestions.js` - Generates API suggestions
- `sw-tips.js` - Fetches extension development tips

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Type "api" in the address bar and press Space or Tab.
4. Start typing an API name (e.g., "tabs", "storage", "scripting").
5. Select a suggestion or press Enter to open the API reference page.
