import path from 'path';
import fs from 'fs/promises';
import { AVAILABLE_FOLDERS, REPO_BASE_URL } from '../constants';
import { getApiListForSample } from './api-detector';
import type { AvailableFolderItem, SampleItem } from '../types';
import { getBasePath, isFileExists } from '../utils/filesystem';
import { getManifestMetadata } from '../utils/manifest';

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

  // get all subfolders in the folder
  const subfolders = await fs.readdir(
    path.join(basePath, currentRootFolderPath)
  );

  for (let subfolder of subfolders) {
    const currentPath = path.join(basePath, currentRootFolderPath, subfolder);
    const manifestPath = path.join(currentPath, 'manifest.json');
    // check if manifest.json exists
    const manifestExists = await isFileExists(manifestPath);
    if (manifestExists) {
      // get manifest metadata
      const manifestMetadata = await getManifestMetadata(
        manifestPath,
        subfolder
      );

      // add to samples
      samples.push({
        type: sampleType,
        name: subfolder,
        repo_link: new URL(
          `${REPO_BASE_URL}${currentPath.replace(basePath, '')}`
        ).toString(),
        apis: await getApiListForSample(currentPath),
        ...manifestMetadata
      });
    } else {
      // if manifest.json does not exist, loop through all folders in current folder
      const currentSamples = await getSamples(
        path.join(currentRootFolderPath, subfolder),
        sampleType
      );
      samples.push(...currentSamples);
    }
  }
  return samples;
};
