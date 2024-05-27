# chrome.privacy

This sample demonstrates using `chrome.privacy.services` to get and set privacy settings.

## Overview

The service worker sets the default value for autofill using `chrome.privacy.services.autofillCreditCardEnabled.set()` when the extension is installed. Whenever the action button is clicked, the extension toggles the current autofill setting of `autofillCreditCardEnabled` and updates the extension badge.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the taskbar and click the action button.
