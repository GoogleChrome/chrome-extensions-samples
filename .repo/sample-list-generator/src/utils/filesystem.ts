import fs from 'fs/promises';
import path from 'path';

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
  return path.join(__dirname, '../../../../');
};
