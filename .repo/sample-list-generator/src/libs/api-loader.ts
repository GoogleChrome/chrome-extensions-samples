import path from 'path';
import fs from 'fs/promises';
import type { ExtensionApiMap } from '../types';
import { isFileExists } from '../utils/filesystem';

export const loadExtensionApis = async (): Promise<ExtensionApiMap> => {
  const filePath = path.join(__dirname, '../../extension-apis.json');

  // check if extension-apis.json exists
  if (!(await isFileExists(filePath))) {
    console.error(
      'extension-apis.json does not exist. Please run "npm run prepare-chrome-types" first.'
    );
    process.exit(1);
  }

  let _EXTENSION_API_MAP = await fs.readFile(filePath, 'utf8');
  let EXTENSION_API_MAP = JSON.parse(_EXTENSION_API_MAP) as ExtensionApiMap;
  return EXTENSION_API_MAP;
};
