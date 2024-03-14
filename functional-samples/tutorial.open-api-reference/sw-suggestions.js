import apiList from './api-list.js';

/**
 * Returns a list of suggestions and a description for the default suggestion
 */
export async function getApiSuggestions(input) {
  const suggestions = apiList.filter((api) => api.content.startsWith(input));

  // return suggestions if any exist
  if (suggestions.length) {
    return {
      description: 'Matching Chrome APIs',
      suggestions: suggestions
    };
  }

  // return past searches if no match was found
  const { apiSuggestions } = await chrome.storage.local.get('apiSuggestions');
  return {
    description: 'No matches found. Choose from past searches',
    suggestions: apiList.filter((item) => apiSuggestions.includes(item.content))
  };
}
