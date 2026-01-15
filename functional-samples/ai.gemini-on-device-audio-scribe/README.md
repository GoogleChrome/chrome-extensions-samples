# Audio-Scribe: Transcribe audio messages with Chrome's multimodal Prompt API

This sample demonstrates how to use Chrome's built-in AI APIs to transcribe audio messages directly in the browser. It uses:

- **[Prompt API](https://developer.chrome.com/docs/extensions/ai/prompt-api)** with multimodal audio input (Gemini Nano) for on-device speech-to-text transcription

## Overview

Audio-Scribe adds a side panel that automatically transcribes audio messages from chat applications. When activated, it:

1. Monitors the page for audio blobs created via `URL.createObjectURL`.
2. Detects audio content and sends it to Gemini Nano for transcription.
3. Streams the transcribed text in real-time to the side panel.
4. Works with messaging apps like WhatsApp Web that use blob URLs for audio messages.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
3. Open a chat app in the browser, for example https://web.whatsapp.com/. You can also run the included demo chat app:
   ```
   npx serve demo-chat-app
   ```
4. Open the Audio-Scribe side panel by clicking the extension icon or pressing `Alt+A`.
5. Play or load audio messages in the chat - they will be automatically transcribed in the side panel.

![Screenshot displaying a demo chat app with a few audio messages. On the right, there is the audio-scribe extension's sidepanel which displayes the transcribed text messages](assets/screenshot.png)
