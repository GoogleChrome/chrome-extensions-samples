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

  let data = fs.readFileSync(filePath, 'utf8');
  const apiMap = JSON.parse(data);

  // Due to the specific implementation of this API, we need to manually add it
  // to the list of APIs recognised by the sample list generator.
  apiMap['aiOriginTrial.languageModel'] = {
    properties: [],
    methods: ['create', 'capabilities', 'params', 'availability'],
    types: [],
    events: []
  };

  return apiMap;
};
