import fs from 'fs/promises';
import { dirname } from 'path';
import { ManifestData, LocaleData } from '../types';
const localeRegex = /__MSG_([^_]*)__/

function usesLocaleFiles(obj: object): boolean {
  // recursively check if any value in a supplied object
  // is a string that starts with __MSG_. If found, it 
  // means that the extension uses locale files.
  return Object.values(obj).some((value) => {
    if (Object.prototype.toString.call(value) === '[object Object]') {
      return usesLocaleFiles(value);
    }
    return typeof value === 'string' && value.startsWith('__MSG_')
  });
}

export const getManifest = async (
  manifestPath: string
): Promise<ManifestData> => {
  const manifest = await fs.readFile(manifestPath, 'utf8');
  const parsedManifest = JSON.parse(manifest);

  if (usesLocaleFiles(parsedManifest)) {
    const directory = dirname(manifestPath);
    const localeFile: string = await fs.readFile(`${directory}/_locales/en/messages.json`, 'utf8')
    const localeData: LocaleData = JSON.parse(localeFile);

    for (const [key, value] of Object.entries(parsedManifest)) {
      if (typeof value === 'string' && value.startsWith('__MSG_')) {
        const localeKey: string | undefined = value.match(localeRegex)?.[1];

        if (localeKey) {
          const localeKeyData = localeData[localeKey]
          const localeMessage: string = localeKeyData?.message;

          parsedManifest[key] = localeMessage;
        }
      }
    }
  }

  return parsedManifest;
};
