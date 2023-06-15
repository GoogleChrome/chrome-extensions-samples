import { IAvailableFolderItem } from "./types";

// Define all available folders for samples
export const AVAILABLE_FOLDERS: IAvailableFolderItem[] = [
  {
    path: 'api-samples',
    type: 0
  },
  {
    path: 'functional-samples',
    type: 1
  }
];

export const REPO_BASE_URL =
  'https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/';
