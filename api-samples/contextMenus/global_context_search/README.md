# chrome.contextMenus

This sample demonstrates the `chrome.contextMenus` API by letting a user search Google with region-specific parameters via a context menu.

## Overview

Modern Google Search uses IP geolocation and query parameters for localization instead of domain-based routing (e.g., google.com.br). This sample reflects that reality.

The extension uses:
- `chrome.contextMenus.create()` to populate context menu with region options
- Query parameters: `cr` (country restriction) and `lr` (language restriction)
- A popup UI to enable/disable regions
- `chrome.contextMenus.onClicked.addListener()` to open searches in new tabs

## Key Implementation Details

- **Base URL**: All searches use `https://www.google.com/search`
- **Country Parameter (cr)**: Restricts results to a specific country (e.g., `countryCA` for Canada)
- **Language Parameter (lr)**: Restricts results to a specific language (e.g., `lang_en` for English)

While these parameters don't guarantee region-specific results (as IP geolocation is the primary factor), they're the modern, programmatic way to express regional preference to Google Search.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the taskbar to access the action button.
4. Open the extension popup by clicking the action button to enable/disable regions.
5. Select text on any webpage and right-click to access the context menu with region options.
6. Click a region to search for your selected text with that region's parameters.
