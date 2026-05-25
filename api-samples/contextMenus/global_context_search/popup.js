// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { countryLocales } from './locales.js';

createForm().catch(console.error);

async function createForm() {
  const { enabledCountries = Object.keys(countryLocales) } =
    await chrome.storage.sync.get('enabledCountries');
  const checked = new Set(enabledCountries);

  const form = document.getElementById('form');
  for (const [countryCode, locale] of Object.entries(countryLocales)) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked.has(countryCode);
    checkbox.name = countryCode;
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
  const countryCode = checkbox.name;
  const enabled = checkbox.checked;

  const { enabledCountries = Object.keys(countryLocales) } =
    await chrome.storage.sync.get('enabledCountries');
  const countrySet = new Set(enabledCountries);

  if (enabled) countrySet.add(countryCode);
  else countrySet.delete(countryCode);

  await chrome.storage.sync.set({ enabledCountries: [...countrySet] });
}
