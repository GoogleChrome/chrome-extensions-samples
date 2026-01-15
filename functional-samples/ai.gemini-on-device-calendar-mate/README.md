# Calendar Mate: On-device AI with Gemini Nano

This sample demonstrates how to use Chrome's built-in Gemini Nano Language Model API in an extension to extract calendar event details from natural language text. To learn more about the API, see [Built-in AI on developer.chrome.com](https://developer.chrome.com/docs/extensions/ai/prompt-api).

## Overview

Calendar Mate allows users to quickly create Google Calendar events from any selected text on a webpage. Simply highlight text describing an event (e.g., "Team meeting on Friday at 3pm in Conference Room A"), right-click, and select "Create Calendar Event". The extension uses Gemini Nano to intelligently extract:

- Event title
- Start and end date/time
- Location
- Description
- Timezone

The extracted details are used to pre-populate a new Google Calendar event.

## Running this extension

1. Clone this repository.
2. Run `npm install` in the project directory.
3. Run `npm run build` to build the extension.
4. Load the `dist` directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
5. Select any text on a webpage that describes an event.
6. Right-click and choose "Create Calendar Event" from the context menu.

## How it works

1. **Context Menu**: The extension adds a "Create Calendar Event" option to Chrome's right-click context menu when text is selected.
2. **AI Extraction**: When triggered, the selected text is sent to Gemini Nano with a prompt to extract event details as structured JSON.
3. **Date Parsing**: The extracted date/time strings are parsed using the [any-date-parser](https://www.npmjs.com/package/any-date-parser) library.
4. **Calendar Integration**: A Google Calendar URL is generated with the extracted details and opened in a new tab.
