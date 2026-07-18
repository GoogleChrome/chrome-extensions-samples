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

let browser;
let worker;

beforeEach(async () => {
  browser = await puppeteer.launch({
    // Set to 'new' to hide Chrome if running as part of an automated build.
    headless: false,
    pipe: true,
    enableExtensions: [EXTENSION_PATH]
  });

  const workerTarget = await browser.waitForTarget(
    // Assumes that there is only one service worker created by the extension and its URL ends with service-worker.js.
    (target) =>
      target.type() === 'service_worker' &&
      target.url().endsWith('service-worker.js')
  );

  worker = await workerTarget.worker();
});

afterEach(async () => {
  await browser.close();
  browser = undefined;
});

test('one history item is visible', async () => {
  // Open a page to add a history item.
  const page = await browser.newPage();
  await page.goto('https://example.com');

  // Open the extension popup.
  await worker.evaluate('chrome.action.openPopup();');

  const popupTarget = await browser.waitForTarget(
    // Assumes that there is only one page with the URL ending with popup.html
    // and that is the popup created by the extension.
    (target) => target.type() === 'page' && target.url().endsWith('popup.html')
  );

  const popup = await popupTarget.asPage();

  const list = await popup.$('ul');
  const children = await list.$$('li');

  expect(children.length).toBe(1);
});
