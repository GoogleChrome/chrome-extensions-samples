// Copyright 2023 Google LLC
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

const ADD_ITEM_BUTTON_ID = 'add-item';
const ITEMS_TABLE_ID = 'items';
const TABLE_ITEM_TEMPLATE_ID = 'table-item';
const READ_SELECT_YES_VALUE = 'yes';
const READ_SELECT_NO_VALUE = 'no';

/**
 * Removes an entry from the reading list.
 *
 * @param url URL of entry to remove.
 */
async function removeEntry(url) {
  await chrome.readingList.removeEntry({ url });
}

/**
 * Adds an entry to the reading list.
 *
 * @param title Title of the entry
 * @param url URL of entry to add
 * @param hasBeenRead If the entry has been read
 */
async function addEntry(title, url, hasBeenRead) {
  await chrome.readingList.addEntry({ title, url, hasBeenRead });
}

/**
 * Updates an entry in the reading list.
 *
 * @param url URL of entry to update
 * @param hasBeenRead If the entry has been read
 */
async function updateEntry(url, hasBeenRead) {
  await chrome.readingList.updateEntry({ url, hasBeenRead });
}

/**
 * Updates the UI with the current reading list items.
 */
async function updateUI() {
  const items = await chrome.readingList.query({});

  const table = document.getElementById(ITEMS_TABLE_ID);

  for (const item of items) {
    // Use existing row if possible, otherwise create a new one.
    const row =
      document.querySelector(`[data-url="${item.url}"]`) ||
      document.getElementById(TABLE_ITEM_TEMPLATE_ID).content.cloneNode(true)
        .children[0];

    updateRow(row, item);

    table.appendChild(row);
  }

  // Remove any rows that no longer exist
  table.querySelectorAll('tr').forEach((row, i) => {
    // Ignore header row
    if (i === 0) return;
    if (!items.find((i) => i.url === row.getAttribute('data-url'))) {
      row.remove();
    }
  });
}

/**
 * Updates a row with the data from item.
 *
 * @param row Table row element to update.
 * @param item Data from reading list API.
 */
function updateRow(row, item) {
  row.setAttribute('data-url', item.url);

  const titleField = row.querySelector('td:nth-child(1) a');
  titleField.href = item.url;
  titleField.innerText = item.title;

  const readField = row.querySelector('td:nth-child(2) select');
  readField.value = item.hasBeenRead
    ? READ_SELECT_YES_VALUE
    : READ_SELECT_NO_VALUE;

  const createdAtField = row.querySelector('td:nth-child(3)');
  createdAtField.innerText = `${new Date(item.creationTime).toLocaleString()}`;

  const deleteButton = row.querySelector('.delete-button');
  deleteButton.addEventListener('click', async (event) => {
    event.preventDefault();
    await removeEntry(item.url);
    updateUI();
  });

  const updateButton = row.querySelector('.update-button');
  updateButton.addEventListener('click', async (event) => {
    event.preventDefault();
    await updateEntry(item.url, readField.value === READ_SELECT_YES_VALUE);
  });
}

const ERROR_ID = 'error';

const ITEM_TITLE_SELECTOR = '[name="title"]';
const ITEM_URL_SELECTOR = '[name="url"]';
const ITEM_READ_SELECTOR = '[name="read"]';

// Add item button click handler
document
  .getElementById(ADD_ITEM_BUTTON_ID)
  .addEventListener('click', async () => {
    try {
      // Get data from input fields
      const title = document.querySelector(ITEM_TITLE_SELECTOR).value;
      const url = document.querySelector(ITEM_URL_SELECTOR).value;
      const hasBeenRead =
        document.querySelector(ITEM_READ_SELECTOR).value ===
        READ_SELECT_YES_VALUE;

      // Attempt to add the entry
      await addEntry(title, url, hasBeenRead);
      document.getElementById(ERROR_ID).style.display = 'none';
    } catch (ex) {
      // Something went wrong, show an error
      document.getElementById(ERROR_ID).innerText = ex.message;
      document.getElementById(ERROR_ID).style.display = 'block';
    }

    updateUI();
  });

updateUI();

// Update the UI whenever data in the reading list changes
chrome.readingList.onEntryAdded.addListener(updateUI);
chrome.readingList.onEntryRemoved.addListener(updateUI);
chrome.readingList.onEntryUpdated.addListener(updateUI);
