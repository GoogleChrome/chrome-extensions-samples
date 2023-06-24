import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs/promises';
import { TExtensionApiMap } from './types';

const SINGULAR_TO_PLURAL_MAP: Record<string, string> = {
  property: 'properties',
  method: 'methods',
  event: 'events',
  type: 'types'
};

// get variable type
// e.g. method-openPopup -> methods
const getTypeFromPageId = (pageId: string) => {
  return SINGULAR_TO_PLURAL_MAP[pageId.split('-').shift() as string];
};

// Fetch the latest version of the chrome types from storage
const fetchChromeTypes = async (): Promise<Record<string, any>> => {
  console.log('Fetching chrome types...');

  const response = await fetch(
    'https://storage.googleapis.com/download/storage/v1/b/external-dcc-data/o/chrome-types.json?alt=media'
  );
  const chromeTypes = await response.json();
  return chromeTypes;
};

const run = async () => {
  const result: TExtensionApiMap = {};

  const chromeTypes = await fetchChromeTypes();

  // find all apis with dot
  result['$special'] = Object.keys(chromeTypes)
    .filter((apiName) => apiName.includes('.'))
    .map((item) => item.replace('.', '_'));

  for (const [chromeApiKey, chromeApiDetails] of Object.entries(chromeTypes)) {
    const apiDetails: TExtensionApiMap[string] = {
      properties: [],
      methods: [],
      types: [],
      events: []
    };

    for (let variable of chromeApiDetails._type.properties) {
      const name = variable.name as string;
      const type = getTypeFromPageId(variable._pageId) as string;
      apiDetails[type].push(name);
    }

    result[chromeApiKey] = apiDetails;
  }

  console.log('Writing to file...');
  await fs.writeFile(
    path.join(__dirname, '../extension-apis.json'),
    JSON.stringify(result, null, 2)
  );
  console.log('Done!');
};

run();
