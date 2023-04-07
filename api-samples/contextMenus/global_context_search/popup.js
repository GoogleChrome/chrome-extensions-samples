// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// TLD: top level domain; the "com" in "google.com"
import { tldLocales } from './locales.js';

createForm().catch(console.error);

async function createForm() {
  const { enabledTlds = Object.keys(tldLocales) } =
    await chrome.storage.sync.get('enabledTlds');
  const checked = new Set(enabledTlds);

  const form = document.getElementById('form');
  for (const [tld, locale] of Object.entries(tldLocales)) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked.has(tld);
    checkbox.name = tld;
    checkbox.addEventListener('click', (event) => {
      handleCheckboxClick(event).catch(console.error);
    });

    const span = document.createElement('span');
    span.textContent = locale;

    const div = document.createElement('div');
    div.appendChild(checkbox);
    div.appendChild(span);

    form.appendChild(div);
  }
}

async function handleCheckboxClick(event) {
  const checkbox = event.target;
  const tld = checkbox.name;
  const enabled = checkbox.checked;

  const { enabledTlds = Object.keys(tldLocales) } =
    await chrome.storage.sync.get('enabledTlds');
  const tldSet = new Set(enabledTlds);

  if (enabled) tldSet.add(tld);
  else tldSet.delete(tld);

  await chrome.storage.sync.set({ enabledTlds: [...tldSet] });
}
