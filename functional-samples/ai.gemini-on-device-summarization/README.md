# On-device Summarization with Gemini Nano

This sample demonstrates how to use Chrome's built-in Summarizer API to generate AI-powered summaries of web pages directly on the user's device. The summarization runs entirely locally using Gemini Nano, ensuring privacy and fast performance without requiring an internet connection or API keys.

To learn more about the Summarizer API, head over to the [Summarizer API guide on developer.chrome.com](https://developer.chrome.com/docs/ai/summarizer-api).

## Overview

This extension adds a side panel that automatically displays AI-generated summaries of any web page you visit. It uses Mozilla's [Readability](https://github.com/mozilla/readability) library to extract the main content from web pages (stripping away navigation, ads, and other clutter), then passes that content to Chrome's built-in Summarizer API.

## Running this extension

1. Clone this repository.
2. Run `npm install` in this folder to install all dependencies.
3. Run `npm run build` to build the extension.
4. Load the newly created `dist` directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
5. Click the extension icon to open the summary side panel.
6. Open any web page. The page's content summary will automatically be displayed in the side panel.

## Creating your own extension

If you use this sample as the foundation for your own extension, be sure to update the `"trial_tokens"` field [with your own origin trial token](https://developer.chrome.com/docs/web-platform/origin-trials#extensions) and to remove the `"key"` field in `manifest.json`.
