This recipe shows how to use User Media in an Extension Service Worker using the [Offscreen document][1].

## Context

- The extension aims to capture audio from the user in the context of extension (globally) via a media recorder in the offscreen document.
- Service worker no longer have access to window objects and APIs. Hence, it was difficult for the extension to fetch permissions and capture audio.
- Offscreen document handles permission checks, audio devices management and recording using navigator API and media recorder respectively.

## Steps

1. User presses START/STOP recording from extension popup
2. Popup sends message to background service worker.
3. If STOP, Service worker sends message to offscreen to stop mediarecorder.
4. If START, Service worker sends message to the active tab's content script to intiate recording process.
5. The content script sends message to offscreen to check audio permissions.
   - If GRANTED, send message to offscreen to start media recorder.
   - If DENIED, show alert on window
   - If PROMPT,
     - inject an IFrame to request permission from the user.
     - Listen to the user'e response on the iFrame
     - If allowed, move to GRANTED step. Else, DENIED.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension][2].
3. Open the Extension menu and click the extension named "Offscreen API - User media".

Click on the extension popup for START and STOP recording buttons.

Inspect the offscreen html page to view logs from media recorder and audio chunk management.

[1]: https://developer.chrome.com/docs/extensions/reference/offscreen/
[2]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
