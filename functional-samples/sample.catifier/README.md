# Catifier Sample

This sample demonstrates a Chrome extension called Catifier, which replaces every `jpg` or `jpeg` image on webpages with a specific cat image.

## Overview

Catifier modifies the content of webpages by intercepting requests for jpg or jpeg images and replacing them with a predefined cat image sourced from [this](https://i.chzbgr.com/completestore/12/8/23/S__rxG9hIUK4sNuMdTIY9w2.jpg) image.

## Implementation Notes

Catifier utilizes the capabilities of Chrome extensions to intercept and modify webpage content dynamically. It demonstrates how extensions can be used to customize the browsing experience for users.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Select and open the extension from the extensions menu.
4. To test the extension, click on 'Sample minute' to set an alarm of 1 minute, post which a notification appears in the system tray.
