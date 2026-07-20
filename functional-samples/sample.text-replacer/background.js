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

const REPLACE_TEXT_MENUITEM_ID = 'replace-text-menuitem';
const REPLACE_TEXT_COMMAND_ID = 'replace-text-command';
const GET_REPLACEMENTS_MESSAGE_ID = 'get-replacements';
const SET_REPLACEMENTS_MESSAGE_ID = 'set-replacements';

chrome.runtime.onInstalled.addListener(async () => {
  // Remove any previously registered context menus to avoid conflicts
  await chrome.contextMenus.removeAll();

  // Register the new set of context menus
  await chrome.contextMenus.create({
    id: REPLACE_TEXT_MENUITEM_ID,
    title: 'Replace text',
  });
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command == REPLACE_TEXT_COMMAND_ID) {
    replaceText(tab.id);
  } else {
    throw new Error(`Unknown command executed with ID "${command}"`);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId == REPLACE_TEXT_MENUITEM_ID) {
    replaceText(tab.id);
  } else {
    throw new Error(`Unknown context menu option clicked with ID "${info.menuItemId}"`);
  }
});

// Route all storage reads/writes through the background so we have a single
// source of truth.
chrome.runtime.onMessage.addListener((message, ) => {
  switch (message.id) {
    case GET_REPLACEMENTS_MESSAGE_ID:
      // Fall back to an empty array 'patterns' is not set
      return chrome.storage.sync.get({patterns: []});

    case SET_REPLACEMENTS_MESSAGE_ID:
      return chrome.storage.sync.set({'patterns': message.data});

    default:
      throw new Error(`Unknown message received with ID "${message.id}"`);
  }
});

function replaceText(tabId) {
  chrome.scripting.executeScript({
    target: {tabId},
    files: ['content.js'],
  });
}
