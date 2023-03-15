import apiList from './api-list.js';

/**
 * Returns a list of suggestions and a description for the default suggestion
 */
export async function getApiSuggestions(input) {
  const filtered = apiList.filter((api) => api.content.startsWith(input));
  console.log('filtered', filtered);

  // return suggestions if any exist
  if (filtered.length) {
    return {
      description: 'Matching Chrome APIs',
      suggestions: filtered
    };
  }

  // return past searches if no match was found
  const { apiSuggestions } = await chrome.storage.local.get('apiSuggestions');
  return {
    description: 'No matches found. Choose from past searches',
    suggestions: apiList.filter((item) => apiSuggestions.includes(item.content))
  };
}
