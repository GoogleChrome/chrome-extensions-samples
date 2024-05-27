# chrome.printing

This sample demonstrates all four methods of the `chrome.printing` namespace.

## Overview

The `chrome.printing` namespace only works on ChromeOS. The sample demonstrates how to get a list of available printers and display it to a user. A 'Print' button sends a sample PDF to the selected printer and makes a 'Cancel Printing' visible. This button is visible while the print job's status is `"PENDING"` or `"IN_PROGRESS"`. Note that on some systems, the print job is passed to the printer so quickly that you may never see the 'Cancel Printing' button.

Calling `submitJob()` triggers a dialog box asking the user to confirm printing. Use the [`PrintingAPIExtensionsAllowlist`](https://chromeenterprise.google/policies/#PrintingAPIExtensionsAllowlist") policy to bypass confirmation.

If the **Roll Printers** checkbox is selected, only printers capable of roll printing will appear in the table. In this case, a separate test file is printed and the height of the media can be variable. See [`Roll printing`](https://developer.chrome.com/docs/extensions/reference/printing/#roll-printing) for more information.

## Implementation Notes

Before Chrome 120, `submitJob()` function throws an error when returning a promise.
