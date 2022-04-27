// Copyright 2017 Google LLC
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

// TLD: top level domain; the "com" in "google.com"
import { tldLocales } from './locales.js'

createForm().catch(console.error);

async function createForm() {
  let { enabledTlds = Object.keys(tldLocales) } = await chrome.storage.sync.get('enabledTlds');
  let checked = new Set(enabledTlds)

  let form = document.getElementById('form');
  for (let [tld, locale] of Object.entries(tldLocales)) {
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked.has(tld);
    checkbox.name = tld;
    checkbox.addEventListener('click', (event) => {
      handleCheckboxClick(event).catch(console.error)
    })

    let span = document.createElement('span');
    span.textContent = locale;

    let div = document.createElement('div');
    div.appendChild(checkbox);
    div.appendChild(span);

    form.appendChild(div);
  }
}

async function handleCheckboxClick(event) {
  let checkbox = event.target
  let tld = checkbox.name
  let enabled = checkbox.checked

  let { enabledTlds = Object.keys(tldLocales) } = await chrome.storage.sync.get('enabledTlds');
  let tldSet = new Set(enabledTlds)

  if (enabled) tldSet.add(tld)
  else tldSet.delete(tld)

  await chrome.storage.sync.set({ enabledTlds: [...tldSet] })
}



