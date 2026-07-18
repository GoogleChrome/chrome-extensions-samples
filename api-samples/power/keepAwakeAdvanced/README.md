# chrome.power

This extension demonstrates the `chrome.power` API by allowing users to override their system's power management features.

## Overview

The extension adds an icon that allows the user to choose different power management states when clicked:

- System Default
- Screen stays awake
- System stays awake, but screen can sleep

There is also a popup where the user can also optionally specify an automatic
timeout for the chosen state. This popup can be triggered by clicking the icon
or by selecting it from the icon's context menu.

## Running this extension

Either install it from the Chrome Web Store:

- [Keep Awake Extension](https://chrome.google.com/webstore/detail/keep-awake/bijihlabcfdnabacffofojgmehjdielb)

Or load it as an upacked extension:

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension and click the action button.
