import { getApiSuggestions } from './sw-suggestions.js';

console.log('sw-omnibox.js');

// Initialize default API suggestions
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({
      apiSuggestions: ['tabs', 'storage', 'scripting']
    });
  }
});

const URL_CHROME_EXTENSIONS_DOC =
  'https://developer.chrome.com/docs/extensions/reference/';
const NUMBER_OF_PREVIOUS_SEARCHES = 4;

// Displays the suggestions after user starts typing
chrome.omnibox.onInputChanged.addListener(async (input, suggest) => {
  const { description, suggestions } = await getApiSuggestions(input);
  await chrome.omnibox.setDefaultSuggestion({ description });
  suggest(suggestions);
});

// Opens the reference page of the chosen API
chrome.omnibox.onInputEntered.addListener((input) => {
  chrome.tabs.create({ url: URL_CHROME_EXTENSIONS_DOC + input });
  // Saves the latest keyword
  updateHistory(input);
});

async function updateHistory(input) {
  const { apiSuggestions } = await chrome.storage.local.get('apiSuggestions');
  apiSuggestions.unshift(input);
  apiSuggestions.splice(NUMBER_OF_PREVIOUS_SEARCHES);
  await chrome.storage.local.set({ apiSuggestions });
}
