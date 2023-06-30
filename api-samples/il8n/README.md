# chrome.i18n

This sample demonstrates the `chrome.i18n` API by localizing text in the extension popup.

## Overview

The extension includes localized translations of its UI text in the `\_locales\' folder. It then calls `chrome.i18n.getMessage()` to populate the text in the extension UI with either French or English, depending on the current language setting.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the taskbar to access the action button.
4. Open the extension popup by clicking the action button.
