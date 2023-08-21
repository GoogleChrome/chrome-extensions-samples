# chrome.declarativeNetRequest - No Cookies Rule Manager

This sample demonstrates using the [`chrome.declarativeNetRequest`](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/) API to remove the `Cookie` header from requests matching custom URL filters.

## Overview

This extension has two default rules:

* Any main frame or XHR requests ending with `?nocookies=1` will have their cookies removed (URL Filter).

* Any main frame or XHR requests matching `.*\.google\.com` will have their cookies removed (Regex Filter).

For example, install this extension and try navigating to <https://github.com/GoogleChrome/chrome-extensions-samples?no-cookies=1> or <https://www.google.com> - you should appear signed out. The number of requests modified by this extension will be displayed on the extension's badge.

You can edit these rules in the manager page.

## Implementation Notes

[`chrome.declarativeNetRequest.setExtensionActionOptions()`](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/#method-setExtensionActionOptions) sets the extension's badge text to the number of requests modified by the extension.

`"declarativeNetRequestFeedback"` permission is required to show the matching history.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Click the extension's action icon to open the popup.
4. Click the "Open Manager Tab" button to open the manager page.
