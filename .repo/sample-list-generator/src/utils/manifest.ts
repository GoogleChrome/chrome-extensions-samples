import fs from 'fs/promises';
import { ManifestMetadata } from '../types';

export const getManifestMetadata = async (
  manifestPath: string,
  defaultName: string
): Promise<ManifestMetadata> => {
  const manifest = await fs.readFile(manifestPath, 'utf8');
  const parsedManifest = JSON.parse(manifest);
  const {
    name: title = defaultName,
    description = '',
    permissions = []
  } = parsedManifest;

  return {
    title,
    description,
    permissions
  };
};
