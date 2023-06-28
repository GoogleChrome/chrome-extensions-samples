export type AvailableFolderTypes = (typeof AVAILABLE_FOLDERS)[number]['type'];

// Define all available folders for samples
export const AVAILABLE_FOLDERS = [
  {
    path: 'api-samples',
    type: 'API_SAMPLE'
  },
  {
    path: 'functional-samples',
    type: 'FUNCTIONAL_SAMPLE'
  }
] as const;

export const REPO_BASE_URL =
  'https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/';
