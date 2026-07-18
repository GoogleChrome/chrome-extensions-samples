# chrome.action

This sample demonstrates the use of Action API which changes the badge text,icon,hover text or popup page depending on the user's choice or action.

[API Link](https://developer.chrome.com/docs/extensions/reference/action/)

## Overview

This sample demonstrates the Action API by allowing the user to perform the below actions:

- Toggle Enabled State : to enable or disable the extensions' action button in Chrome's toolbar and menu.
- Change Popup Page : to change the popup page by entering a new string or url.
- Badge Text : to insert a text overlay with a solid background color.
- Icon Image : to change the action button's icon.
- Hover Text : it is visible when mousing over the extension's icon.

## Implementation Notes

The user can set values to implement above functionalities from [here](demo/index.html)

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Click the extension's icon in the toolbar to open the demo page.
