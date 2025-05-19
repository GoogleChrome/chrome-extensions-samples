// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global LanguageModel */

chrome.runtime.onMessage.addListener(async ({ data }) => {
  let content;
  try {
    if (data.type != 'audio-scribe' || !data || !isValidUrl(data.objectUrl)) {
      return;
    }
    // Check if it's an audio file
    const audio = await fetch(data.objectUrl);
    content = await audio.blob();
    if (!content.type || !content.type.startsWidth('audio/')) {
      return;
    }
  } catch (e) {
    console.log(e);
  }

  // Setup message UI
  const messages = document.getElementById('messages');
  const li = document.createElement('li');
  li.append('...');
  messages.append(li);

  try {
    // Transcribe audio
    const availability = await LanguageModel.availability();
    if (availability !== 'available') {
      console.error('Model is', availability);
      throw new Error('Model is not available');
    }
    const session = await LanguageModel.create({
      expectedInputs: [{ type: 'audio' }]
    });
    const stream = session.promptStreaming([
      { type: 'audio', content },
      'transcribe this audio'
    ]);

    // Render streamed response
    let first = true;
    for await (const chunk of stream) {
      if (first) {
        li.textContent = '';
        first = false;
      }
      li.append(chunk);
    }
  } catch (error) {
    console.log(error);
    li.textContent = error.message;
  }
});

function isValidUrl(string) {
  let url;

  try {
    url = new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
