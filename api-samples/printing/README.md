# chrome.printing

This sample demonstrates all four methods of the `chrome.printing` namespace.

## Overview

The `chrome.printing` namespace only works on ChromeOS. The sample demonstrates how to get a list of available printers and display it to a user. A 'Print' button sends a sample PDF to the selected printer and makes a 'Cancel Printing' visible. This button is visible while the print job's status is `"PENDING"` or `"IN_PROGRESS"`. Note that on some systems, the print job is passed to the printer so quickly that you may never see the 'Cancel Printing' button.

Calling `submitJob()` triggers a dialog box asking the user to confirm printing. Use the [`PrintingAPIExtensionsAllowlist`](https://chromeenterprise.google/policies/#PrintingAPIExtensionsAllowlist") policy to bypass confirmation.

## Implementation Notes

Note that the `submitJob()` function throws an error when returning a promise ([crbug: 1422837](https://bugs.chromium.org/p/chromium/issues/detail?id=1422837)).
