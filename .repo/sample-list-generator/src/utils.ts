import fs from 'fs/promises';
import path from 'path';
import { TExtensionApiMap } from './types';

export const getAllFiles = async (dir: string): Promise<string[]> => {
  const result: string[] = [];

  for (const file of await fs.readdir(dir)) {
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);

    if (stats.isFile()) {
      result.push(filePath);
    } else if (stats.isDirectory()) {
      result.push(...(await getAllFiles(filePath)));
    }
  }

  return result;
};

export const isFileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const getBasePath = (): string => {
  return path.join(__dirname, '../../../');
};

export const singularize = (word: string): string => {
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  } else if (word.endsWith('s')) {
    return word.slice(0, -1);
  } else {
    return word;
  }
};

export const loadExtensionApis = async (): Promise<TExtensionApiMap> => {
  const filePath = path.join(__dirname, '../extension-apis.json');
  
  // check if extension-apis.json exists
  if (!(await isFileExists(filePath))) {
    console.error(
      'extension-apis.json does not exist. Please run "npm run prefetch" first.'
    );
    process.exit(1);
  }

  let _EXTENSION_API_MAP = await fs.readFile(filePath, 'utf8');
  let EXTENSION_API_MAP = JSON.parse(_EXTENSION_API_MAP) as TExtensionApiMap;
  return EXTENSION_API_MAP;
};
