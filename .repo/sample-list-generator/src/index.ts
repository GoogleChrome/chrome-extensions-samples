import path from 'path';
import fs from 'fs/promises';
import { getAllSamples } from './libs/sample-collector';

const start = async () => {
  const samples = await getAllSamples();

  // write to extension-samples.json
  await fs.writeFile(
    path.join(__dirname, '../extension-samples.json'),
    JSON.stringify(samples, null, 2)
  );
};

start();
