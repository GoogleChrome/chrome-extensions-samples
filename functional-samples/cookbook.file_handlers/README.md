# Cookbook - File Handling API

This sample demonstrates how to use the File Handling API in an extension.

## Overview

On ChromeOS only, extensions can use the `file_handlers` manifest key to
register as a file handler for particular file types. This behaves in the same
way as the
[equivalent API](https://developer.chrome.com/articles/file-handling/) in web
applications.

## Running this extension

**This API is only supported on ChromeOS**.

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Create a .txt file on your ChromeOS device.
4. In the Files app, select the file.
5. In the toolbar, choose "Open" and then "File Handling API".
