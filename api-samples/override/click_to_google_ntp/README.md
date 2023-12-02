# Customizable New Tab Page - `chrome_url_overrides`

This sample demonstrates the `chrome_url_overrides` manifest key and the customizable new tab feature. The user's default new tab page is replaced with an animated html file with linked JavaScript that makes the entire page a clickable link to Google's home page.

## Overview

The `chrome_url_overrides` is called with the property `"newtab"` to replace the new tab page with a customized new tab. Here the customization is illustrated using click_to_google.html.

## Implementation Notes

This sample builds on **[Blank new tab page](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/override/blank_ntp)**, adding a demonstration to show the new tab page with user graphics, and a simple example of how JavaScript can be linked to a customized new tab, demonstrating minuscule use of the feature.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Open a new tab while the extension is enabled.
4. _Optional_ - click anywhere on the new tab page to navigate to Google's home page.
