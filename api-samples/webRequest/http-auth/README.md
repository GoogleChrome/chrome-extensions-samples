# webRequest.onAuthRequired

This sample demonstrates the `webRequest.onAuthRequired` listener to detect an authentication request and log the user into the designated site.

## Overview

When an authentication check is detected, a check is made to confirm that the request has come from the correct source. Account credentials are then provided for the response via an auth handler.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Open a new tab and navigate to <https://httpbin.org/basic-auth/guest/guest>. You will be prompted to enter a username and password. With this extension installed, the username and password will be automatically provided.
