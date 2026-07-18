import path from 'path';
import fs from 'fs/promises';
import { AVAILABLE_FOLDERS, REPO_BASE_URL } from '../constants';
import { getApiListForSample } from './api-detector';
import type { AvailableFolderItem, SampleItem } from '../types';
import { getBasePath, isDirectory, isFileExists } from '../utils/filesystem';
import { getManifest } from '../utils/manifest';

export const getAllSamples = async () => {
  let samples: SampleItem[] = [];

  // loop through all available folders
  // e.g. api-samples, functional-samples
  for (let samplesFolder of AVAILABLE_FOLDERS) {
    const currentSamples = await getSamples(
      samplesFolder.path,
      samplesFolder.type
    );
    samples.push(...currentSamples);
  }

  return samples;
};

const getSamples = async (
  currentRootFolderPath: string,
  sampleType: AvailableFolderItem['type']
): Promise<SampleItem[]> => {
  const samples: SampleItem[] = [];
  const basePath = getBasePath();

  // get all contents in the folder
  const contents = await fs.readdir(path.join(basePath, currentRootFolderPath));

  for (let content of contents) {
    const currentPath = path.join(basePath, currentRootFolderPath, content);

    // if content is not a folder, skip
    if (!(await isDirectory(currentPath))) {
      continue;
    }

    const manifestPath = path.join(currentPath, 'manifest.json');
    // check if manifest.json exists
    const manifestExists = await isFileExists(manifestPath);
    if (manifestExists) {
      // get manifest metadata
      const manifestData = await getManifest(manifestPath);

      // add to samples
      samples.push({
        type: sampleType,
        name: content,
        repo_link: new URL(
          `${REPO_BASE_URL}${currentPath.replace(basePath, '')}`
        ).toString(),
        apis: await getApiListForSample(currentPath),
        title: manifestData.name || content,
        description: manifestData.description || '',
        permissions: manifestData.permissions || []
      });
    } else {
      // if manifest.json does not exist, loop through all folders in current folder
      const currentSamples = await getSamples(
        path.join(currentRootFolderPath, content),
        sampleType
      );
      samples.push(...currentSamples);
    }
  }
  return samples;
};
