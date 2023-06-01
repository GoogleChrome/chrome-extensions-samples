# chrome.downloads

A sample that demonstrates how to use the [`chrome.downloads`](https://developer.chrome.com/docs/extensions/reference/downloads/) API.

## Overview

In this sample, the [`chrome.downloads.onDeterminingFilename`](https://developer.chrome.com/docs/extensions/reference/downloads/#event-onDeterminingFilename) event is used to set conflict action to `overwrite` for all downloads.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Download a file twice to see the effect.
