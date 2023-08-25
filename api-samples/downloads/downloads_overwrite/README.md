# chrome.downloads

Demonstrates using the [`chrome.downloads.onDeterminingFilename`](https://developer.chrome.com/docs/extensions/reference/downloads/) handler.

## Overview

This sample uses the [`chrome.downloads.onDeterminingFilename`](https://developer.chrome.com/docs/extensions/reference/downloads/#event-onDeterminingFilename) handler to override target filenames for all downloads instead of adding ' (1)', ' (2)', etc..

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Download a file twice to see the effect.
