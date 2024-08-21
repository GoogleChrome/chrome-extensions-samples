# On-device Summarization with Gemini Nano

This sample demonstrates how to use the experimental Summarization API in Chrome. To learn more about the API and how to sign-up for the preview, head over to [Built-in AI on developer.chrome.com](https://developer.chrome.com/docs/ai/built-in).

## Overview

The extension provides a chat interface using the prompt API with Chrome's built-in Gemini Nano model.

## Running this extension

1. Clone this repository
2. Run `npm install` in this folder to install all dependencies.
3. Run `npm run build` to bundle the content script .
4. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
5. Click the extension icon to open the summary side panel.
6. Open any web page, the page's content summary will automatically be displayed in the side panel.
