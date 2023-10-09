// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// eslint-disable-next-line no-undef
const puppeteer = require('puppeteer');

const EXTENSION_PATH = '../../api-samples/history/showHistory';
const EXTENSION_ID = 'jkomgjfbbjocikdmilgaehbfpllalmia';

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const page = await browser.newPage();
  await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);

  const list = await page.$('ul');
  const children = await list.$$('li');

  if (children.length !== 1) {
    throw new Error('Unexpected number of list elements!');
  }

  await browser.close();
}

run();
