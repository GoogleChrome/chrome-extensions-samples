// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { regionOptions } from './locales.js';

createForm().catch(console.error);

async function createForm() {
  const { enabledRegions = Object.keys(regionOptions) } =
    await chrome.storage.sync.get('enabledRegions');
  const checked = new Set(enabledRegions);

  const form = document.getElementById('form');
  for (const [region, label] of Object.entries(regionOptions)) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked.has(region);
    checkbox.name = region;
    checkbox.addEventListener('click', (event) => {
      handleCheckboxClick(event).catch(console.error);
    });

    const span = document.createElement('span');
    span.textContent = label;

    const div = document.createElement('div');
    div.appendChild(checkbox);
    div.appendChild(span);

    form.appendChild(div);
  }
}

async function handleCheckboxClick(event) {
  const checkbox = event.target;
  const region = checkbox.name;
  const enabled = checkbox.checked;

  const { enabledRegions = Object.keys(regionOptions) } =
    await chrome.storage.sync.get('enabledRegions');
  const regionSet = new Set(enabledRegions);

  if (enabled) regionSet.add(region);
  else regionSet.delete(region);

  await chrome.storage.sync.set({ enabledRegions: [...regionSet] });
}
