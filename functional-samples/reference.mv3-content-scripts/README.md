# MV3 Content Scripts Sample

This sample demonstrates executing arbitrary strings in a Chrome extension, as described in the [Executing arbitrary strings][https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#executing-arbitrary-strings] section of the MV3 migration documentation.

## Overview

This sample provides a basic HTML page with buttons to inject a file or execute a function into the current tab using Chrome's scripting API. The `inject-file` button injects a content script file, while the `inject-function` button executes a predefined function. This demonstrates how to dynamically inject code into web pages from a Chrome extension.

## Implementation Notes

Ensure that the necessary permissions for scripting and accessing the active tab are declared in the extension's manifest file. Additionally, modify the `popup.js` file to handle button click events and execute the corresponding scripts.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Select and open the extension from the extensions menu.
4. To test the extension, click on 'Sample minute' to set an alarm of 1 minute, post which a notification appears in the system tray.
