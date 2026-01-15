# Alt Texter: Generate accessible image descriptions with Chrome's multimodal Prompt AI

This sample demonstrates how to use Chrome's built-in AI APIs to generate alt text for images, making web content more accessible. It combines two on-device AI capabilities:

- **[Prompt API](https://developer.chrome.com/docs/extensions/ai/prompt-api)** with multimodal input (Gemini Nano) for image understanding
- **[Translator API](https://developer.chrome.com/docs/ai/translator-api)** for translating descriptions into multiple languages

## Overview

Alt Texter adds a context menu entry for images on the web. When activated, it:

1. Analyzes the image using Gemini Nano's multimodal capabilities
2. Generates a concise, functional description following accessibility best practices (object-action-context framework)
3. Displays the description in a popup where you can optionally translate it
4. Lets you copy the alt text to your clipboard for use elsewhere

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
3. Right-click an image on a webpage and select "Generate alt text".
4. Wait for the description to be generated, then optionally translate it or copy it to your clipboard.
