// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

let recorder;
let chunks = [];
let lastRecordingUrl;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') {
    return;
  }
  handleMessage(message).then(sendResponse, (error) =>
    sendResponse({ state: 'idle', error: error.message })
  );
  return true;
});

async function handleMessage(message) {
  switch (message.type) {
    case 'get-permission-state': {
      const { state } = await navigator.permissions.query({
        name: 'microphone'
      });
      return { state };
    }
    case 'get-state':
      return {
        state: recorder?.state === 'recording' ? 'recording' : 'idle',
        recordingUrl: lastRecordingUrl
      };
    case 'start':
      return startRecording();
    case 'stop':
      recorder?.stop();
      return { state: 'idle' };
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);
  }
}

async function startRecording() {
  if (recorder?.state === 'recording') {
    return { state: 'recording' };
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    return { state: 'idle', error: error.message };
  }
  chunks = [];
  recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  recorder.ondataavailable = (event) => chunks.push(event.data);
  recorder.onstop = () => {
    stream.getTracks().forEach((track) => track.stop());
    if (lastRecordingUrl) {
      URL.revokeObjectURL(lastRecordingUrl);
    }
    // Object URLs stay valid for other extension pages as long as this
    // offscreen document exists.
    lastRecordingUrl = URL.createObjectURL(
      new Blob(chunks, { type: 'audio/webm' })
    );
    chrome.runtime.sendMessage({
      target: 'popup',
      type: 'recording-ready',
      url: lastRecordingUrl
    });
  };
  recorder.start();
  return { state: 'recording' };
}
