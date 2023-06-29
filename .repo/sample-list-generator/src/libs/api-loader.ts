import path from 'path';
import fs from 'fs';
import type { ExtensionApiMap } from '../types';
import { isFileExistsSync } from '../utils/filesystem';

export const loadExtensionApis = (): ExtensionApiMap => {
  const filePath = path.join(__dirname, '../../extension-apis.json');

  // check if extension-apis.json exists
  if (!isFileExistsSync(filePath)) {
    console.error(
      'extension-apis.json does not exist. Please run "npm run prepare-chrome-types" first.'
    );
    process.exit(1);
  }

  let _EXTENSION_API_MAP = fs.readFileSync(filePath, 'utf8');
  let EXTENSION_API_MAP = JSON.parse(_EXTENSION_API_MAP) as ExtensionApiMap;
  return EXTENSION_API_MAP;
};
