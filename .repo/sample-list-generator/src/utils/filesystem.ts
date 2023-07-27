import fs from 'fs/promises';
import { accessSync } from 'fs';
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

export const getAllJsFiles = async (dir: string): Promise<string[]> => {
  const allFiles = await getAllFiles(dir);
  return allFiles.filter((file) =>
    file.endsWith('.js')
  );
}

export const isDirectory = async (path: string): Promise<boolean> => {
  return (await fs.stat(path)).isDirectory()
}

export const isFileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const isFileExistsSync = (filePath: string): boolean => {
  try {
    accessSync(filePath);
    return true;
  } catch {
    return false;
  }
};

export const getBasePath = (): string => {
  return path.join(__dirname, '../../../../');
};
