/* eslint-disable jest/expect-expect */
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

const EXTENSION_PATH = '../test-extension';
const EXTENSION_ID = 'gjgkofgpcmpfpggbgjgdfaaifcmoklbl';

let browser;

beforeEach(async () => {
  browser = await puppeteer.launch({
    // Set to 'new' to hide Chrome if running as part of an automated build.
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });
});

afterEach(async () => {
  await browser.close();
  browser = undefined;
});

/**
 * Stops the service worker associated with a given extension ID. This is done
 * by creating a new Chrome DevTools Protocol session, finding the target ID
 * associated with the worker and running the Target.closeTarget command.
 *
 * @param {Page} browser Browser instance
 * @param {string} extensionId Extension ID of worker to terminate
 */
async function stopServiceWorker(browser, extensionId) {
  const host = `chrome-extension://${extensionId}`;

  const target = await browser.waitForTarget((t) => {
    return t.type() === 'service_worker' && t.url().startsWith(host);
  });

  const worker = await target.worker();
  await worker.close();
}

test('can message service worker when terminated', async () => {
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${EXTENSION_ID}/page.html`);

  // Message without terminating service worker
  await page.click('button');
  await page.waitForSelector('#response-0');

  // Terminate service worker
  await stopServiceWorker(browser, EXTENSION_ID);

  // Try to send another message
  await page.click('button');
  await page.waitForSelector('#response-1');
});
