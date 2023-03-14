import { getAPIsuggestions } from './sw-api-list.js';

console.log('sw-omnibox.js');

// Save default API suggestions
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({ apiSugg: ['tabs', 'storage', 'scripting'] });
  }
});

const chromeURL = 'https://developer.chrome.com/docs/extensions/reference/';

// Displays the suggestions after user starts typing
chrome.omnibox.onInputChanged.addListener(async (input, suggest) => {
  const suggestions = await getAPIsuggestions(input);
  suggest(suggestions);
});

// Opens the reference page of the chosen API
chrome.omnibox.onInputEntered.addListener(async (input) => {
  await chrome.tabs.create({ url: chromeURL + input });
  // Saves the latest keyword
  updateHistory(input);
});

async function updateHistory(input) {
  try {
    const { apiSugg } = await chrome.storage.local.get('apiSugg');
    apiSugg.unshift(input);
    apiSugg.splice(4);
    await chrome.storage.local.set({ apiSugg });
  } catch (error) {
    console.error(error);
  }
}
