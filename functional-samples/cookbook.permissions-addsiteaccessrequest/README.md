# permissions.addSiteAccessRequest() Demo

This sample demonstrates using the `permissions.addSiteAccessRequest` API to request access to a site.

## Overview

This API allows you to request access to an origin listed in `optional_host_permissions` (or withheld by the user) at runtime.

## Running this extension

1. Clone this repository.
2. Make sure you have the latest version of Chrome Canary installed.
3. At chrome://flags, enable the "Extensions Menu Access Control" flag.
4. Close Chrome Canary.
5. Start Chrome Canary with the `--enable-features=ApiPermissionsSiteAccessRequests` flag.
6. Load this directory as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
7. At chrome://extensions, click on "Details" for the extension and unselect "Automatically allow access on the following sites".
8. Visit https://example.com/checkout.
9. Click "Allow 1?"

You will see a banner injected on the page to show that the extension has run.
