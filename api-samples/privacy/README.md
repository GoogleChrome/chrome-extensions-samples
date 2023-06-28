# chrome.privacy

This sample demonstrates using `chrome.privacy.services` to get and set privacy settings.

## Overview

The service worker sets the default value for autofill using `chrome.privacy.services.autofillEnabled.set()` when the extension is installed. Whenever a page is loaded, or when the action button is clicked, the extension will display the current autofill setting of `autofillAddressEnabled` by updating the extension badge.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the taskbar and either click the action button or load a webpage.
