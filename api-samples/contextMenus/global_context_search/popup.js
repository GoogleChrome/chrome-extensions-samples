// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { regions } from './locales.js';

createForm().catch(console.error);

/**
 * Creates the popup form with region checkboxes.
 * Users can enable or disable regions to customize context menu options.
 */
async function createForm() {
  const { enabledRegions = Object.keys(regions) } =
    await chrome.storage.sync.get('enabledRegions');
  const checked = new Set(enabledRegions);

  const form = document.getElementById('form');
  for (const [regionId, regionConfig] of Object.entries(regions)) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked.has(regionId);
    checkbox.name = regionId;
    checkbox.addEventListener('click', (event) => {
      handleCheckboxClick(event).catch(console.error);
    });

    const span = document.createElement('span');
    span.textContent = regionConfig.display;

    const div = document.createElement('div');
    div.appendChild(checkbox);
    div.appendChild(span);

    form.appendChild(div);
  }
}

/**
 * Handles checkbox state changes and updates storage.
 */
async function handleCheckboxClick(event) {
  const checkbox = event.target;
  const regionId = checkbox.name;
  const enabled = checkbox.checked;

  const { enabledRegions = Object.keys(regions) } =
    await chrome.storage.sync.get('enabledRegions');
  const regionSet = new Set(enabledRegions);

  if (enabled) {
    regionSet.add(regionId);
  } else {
    regionSet.delete(regionId);
  }

  await chrome.storage.sync.set({ enabledRegions: [...regionSet] });
}
