export type FolderTypes = "API_SAMPLE" | "FUNCTIONAL_SAMPLE";

// Define all available folders for samples
export const AVAILABLE_FOLDERS: { path: string, type: FolderTypes }[] = [
  {
    path: 'api-samples',
    type: 'API_SAMPLE'
  },
  {
    path: 'functional-samples',
    type: 'FUNCTIONAL_SAMPLE'
  }
];

export const REPO_BASE_URL =
  'https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/';
