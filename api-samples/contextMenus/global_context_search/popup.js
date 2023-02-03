// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

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



