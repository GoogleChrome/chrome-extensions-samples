import { getAPIsuggestions } from './sw-api-list.js';

console.log('sw-omnibox.js');

// Save default API suggestions
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({ apiSugg: ['tabs', 'storage', 'scripting'] });
  }
});

// OMNIBOX LOGIC
const chromeURL = 'https://developer.chrome.com/docs/extensions/reference/';

chrome.omnibox.onInputChanged.addListener(async (input, suggest) => {
  const suggestions = await getAPIsuggestions(input);
  console.log('suggestions', suggestions);
  suggest(suggestions);
});

/* 
    Set omnibox to make suggestions of top APIs
    when user selects one or types one open URLs 
*/
chrome.omnibox.onInputEntered.addListener(async (input) => {
  await chrome.tabs.create({ url: chromeURL + input });
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
