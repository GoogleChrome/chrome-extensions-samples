import fs from 'fs/promises';
import { ManifestData } from '../types';

export const getManifest = async (
  manifestPath: string
): Promise<ManifestData> => {
  const manifest = await fs.readFile(manifestPath, 'utf8');
  const parsedManifest = JSON.parse(manifest);

  return parsedManifest;
};
