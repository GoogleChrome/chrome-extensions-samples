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

const OFFSCREEN_URL = 'offscreen/offscreen.html';

let creating;

async function ensureOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  if (contexts.length > 0) {
    return;
  }
  if (!creating) {
    creating = chrome.offscreen
      .createDocument({
        url: OFFSCREEN_URL,
        reasons: ['USER_MEDIA'],
        justification: 'Recording microphone audio'
      })
      .finally(() => {
        creating = undefined;
      });
  }
  await creating;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'background') {
    return;
  }
  handleMessage(message).then(sendResponse, (error) =>
    sendResponse({ state: 'idle', error: error.message })
  );
  return true;
});

async function handleMessage(message) {
  switch (message.type) {
    case 'start-recording': {
      await ensureOffscreenDocument();
      // getUserMedia in an offscreen document cannot show a permission
      // prompt, so permission has to be granted to the extension origin
      // from a regular extension page first.
      const { state } = await chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'get-permission-state'
      });
      if (state === 'denied') {
        return { state: 'permission-denied' };
      }
      if (state !== 'granted') {
        await chrome.tabs.create({
          url: chrome.runtime.getURL('permission.html')
        });
        return { state: 'permission-needed' };
      }
      return chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'start'
      });
    }
    case 'stop-recording':
      return chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'stop'
      });
    case 'get-state': {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
      });
      if (contexts.length === 0) {
        return { state: 'idle' };
      }
      return chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'get-state'
      });
    }
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);
  }
}
