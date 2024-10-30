# On-device AI with Gemini Nano

This sample demonstrates how to use the experimental Gemini Nano API available in the context of an origin trial in Chrome with Chrome Extensions. To learn more about the API and how to sign-up for the origin trial, head over to [Built-in AI on developer.chrome.com](https://developer.chrome.com/docs/ai/built-in).

## Overview

The extension provides a chat interface using the Prompt API with Chrome's built-in Gemini Nano model.

## Running this extension

1. Clone this repository.
1. Launch Chrome with the following flag, which makes sure the origin trial token in `manifest.json` is accepted by the browser. This won't be necessary once the origin trial is live.

   `--origin-trial-public-key=dRCs+TocuKkocNKa0AtZ4awrt9XKH2SQCI6o4FY6BNA=`
1. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
1. Click the extension icon.
1. Interact with the Prompt API in the sidebar.

## Creating your own extension

If you use this sample as the foundation for your own extension, be sure to update the `"trial_tokens"` field [with your own origin trial token](https://developer.chrome.com/docs/web-platform/origin-trials?hl=en#extensions) and to remove the `"key"` field in `manifest.json`.
