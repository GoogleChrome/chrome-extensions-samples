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

const STATUS_TEXT = {
  idle: 'Ready to record.',
  recording: 'Recording...',
  'permission-needed': 'Grant microphone access in the opened tab.',
  'permission-denied':
    'Microphone access is blocked for this extension. Reset it under ' +
    'chrome://settings/content/microphone, then try again.'
};

const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const status = document.getElementById('status');

function showState({ state, error, recordingUrl }) {
  startButton.disabled = state === 'recording';
  stopButton.disabled = state !== 'recording';
  status.textContent = error ?? STATUS_TEXT[state] ?? 'Something went wrong.';
  if (recordingUrl) {
    showRecording(recordingUrl);
  }
}

function showRecording(url) {
  document.getElementById('result').hidden = false;
  document.getElementById('playback').src = url;
  document.getElementById('download').href = url;
}

startButton.onclick = async () => {
  startButton.disabled = true;
  showState(
    await chrome.runtime.sendMessage({
      target: 'background',
      type: 'start-recording'
    })
  );
};

stopButton.onclick = async () => {
  showState(
    await chrome.runtime.sendMessage({
      target: 'background',
      type: 'stop-recording'
    })
  );
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.target !== 'popup') {
    return;
  }
  if (message.type === 'recording-ready') {
    showState({ state: 'idle', recordingUrl: message.url });
  }
});

chrome.runtime
  .sendMessage({ target: 'background', type: 'get-state' })
  .then(showState);
