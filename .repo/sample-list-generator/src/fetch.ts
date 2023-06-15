import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { TExtensionApiMap } from './types';

const getApiNames = async () => {
  const re =
    /<tr><td><a class="link weight-medium" href=(\S+)>(\S+)<\/a><\/td><td class="reference-collapse type">/g;
  const rawHtml = await (
    await fetch('https://developer.chrome.com/docs/extensions/reference/')
  ).text();
  const matches = [...rawHtml.matchAll(re)];
  return matches.map((match) => match[1]);
};

const getApiDetails = async (apiName: string) => {
  const rawHtml = await (
    await fetch(
      `https://developer.chrome.com/docs/extensions/reference/${apiName}`
    )
  ).text();
  const dom = new JSDOM(rawHtml);
  const document = dom.window.document;
  // get properties
  const properties = getApiDetailsByType(document, 'property');
  // get methods
  const methods = getApiDetailsByType(document, 'method');
  // get events
  const events = getApiDetailsByType(document, 'event');
  // get types
  const types = getApiDetailsByType(document, 'type');

  return {
    properties,
    methods,
    events,
    types
  };
};

const getApiDetailsByType = (document: Document, type: string) => {
  return [...document.querySelectorAll(`h3[id^=${type}-]`)]
    .map((item) => item.textContent || '')
    .filter(Boolean);
};

(async () => {
  console.log('Fetching API names...');
  const apiNames = await getApiNames();
  const result: TExtensionApiMap = {};
  for (let i = 0; i < apiNames.length; i++) {
    const apiName = apiNames[i];
    console.log(
      `[${i + 1}/${apiNames.length}] Fetching API details for ${apiName}...`
    );
    const apiDetails = await getApiDetails(apiName);

    result[apiName] = apiDetails;
  }

  result['$special'] = apiNames.filter((apiName) => apiName.includes('_'));

  console.log('Writing to file...');
  await fs.writeFile(
    path.join(__dirname, '../extension-apis.json'),
    JSON.stringify(result, null, 2)
  );
  console.log('Done!');
})();
