This recipe shows how to record microphone audio with `getUserMedia()` in
an [offscreen document][1].

`getUserMedia()` inside an offscreen document cannot show a permission
prompt. The permission has to be granted to the extension's origin from a
regular extension page first; after that, the offscreen document can record
without any visible surface. This sample prompts from a page opened in a
tab, records in the offscreen document, and offers the finished recording
in the popup for playback and download.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension][2].
3. Click the extension's action icon and press "Start recording". The first
   use opens a tab asking for microphone access; the tab closes itself once
   access is granted. Press "Start recording" again to begin recording.
4. Press "Stop recording" to play back or download the recording.

[1]: https://developer.chrome.com/docs/extensions/reference/api/offscreen
[2]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
