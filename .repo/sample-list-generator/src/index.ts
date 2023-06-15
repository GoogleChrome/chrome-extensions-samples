import path from 'path';
import fs from 'fs/promises';

import { AVAILABLE_FOLDERS, REPO_BASE_URL } from './constants';
import { getApiListForSample } from './api-detector';
import type { IAvailableFolderItem, ISampleItem } from './types';
import { getBasePath, isFileExists } from './utils';

const getAllSamples = async () => {
  let samples: ISampleItem[] = [];

  // loop through all available folders
  // e.g. api-samples, functional-samples
  for (let samplesFolder of AVAILABLE_FOLDERS) {
    const currentSamples = await getSamples(samplesFolder.path, samplesFolder);
    samples = [...samples, ...currentSamples];
  }

  return samples;
};

const getSamples = async (
  folderPath: string,
  samplesFolder: IAvailableFolderItem
): Promise<ISampleItem[]> => {
  const samples: ISampleItem[] = [];
  const basePath = getBasePath();

  // get all subfolders in the folder
  const folders = await fs.readdir(path.join(basePath, folderPath));

  for (let folder of folders) {
    const currentPath = path.join(basePath, folderPath, folder);
    const manifestPath = path.join(currentPath, 'manifest.json');
    // check if manifest.json exists
    const manifestExists = await isFileExists(manifestPath);
    if (manifestExists) {
      // get manifest.json
      const manifest = await fs.readFile(manifestPath, { encoding: 'utf-8' });
      const parsedManifest = JSON.parse(manifest);
      // add to samples
      samples.push({
        type: samplesFolder.type,
        name: folder,
        title: parsedManifest.name || folder,
        description: parsedManifest.description || '',
        repo_link: new URL(
          `${REPO_BASE_URL}${currentPath.replace(basePath, '')}`
        ).toString(),
        permissions: parsedManifest.permissions || [],
        apis: await getApiListForSample(currentPath)
      });
    } else {
      // if manifest.json does not exist, loop through all folders in current folder
      const currentSamples = await getSamples(
        path.join(folderPath, folder),
        samplesFolder
      );
      samples.push(...currentSamples);
    }
  }
  return samples;
};

(async () => {
  // check if extension-apis.json exists
  if (!(await isFileExists(path.join(__dirname, '../extension-apis.json')))) {
    console.error(
      'extension-apis.json does not exist. Please run "npm run prefetch" first.'
    );
    return;
  }

  const samples = await getAllSamples();

  // write to extension-samples.json
  await fs.writeFile(
    path.join(__dirname, '../extension-samples.json'),
    JSON.stringify(samples, null, 2)
  );

  console.log('Done!');
})();
