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
const { Builder, Browser, By, until } = require('selenium-webdriver');
// eslint-disable-next-line no-undef
const { Options } = require('selenium-webdriver/chrome');

const EXTENSION_PATH = '../test-extension';
const EXTENSION_ID = 'gjgkofgpcmpfpggbgjgdfaaifcmoklbl';

let driver;
let cdpConnection;

beforeEach(async () => {
  driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(
      new Options().addArguments([
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`
      ])
    )
    .build();

  // Create this here, since there is one connection per driver and we want to
  // avoid repeatedly recreating it.
  cdpConnection = await driver.createCDPConnection('page');
});

afterEach(async () => {
  await driver.quit();
  driver = undefined;
});

/**
 * Stops the service worker associated with a given extension ID. This is done
 * by creating a new Chrome DevTools Protocol session, finding the target ID
 * associated with the worker and running the Target.closeTarget command.
 *
 * @param {Driver} driver Driver that CDP session can be started from
 * @param {string} extensionId Extension ID of worker to terminate
 */
async function stopServiceWorker(driver, extensionId) {
  const host = `chrome-extension://${extensionId}`;

  // Find the extension service worker
  const response = await cdpConnection.send('Target.getTargets', {});
  const worker = response.result.targetInfos.find(
    (t) => t.type === 'service_worker' && t.url.startsWith(host)
  );

  if (!worker) {
    throw new Error(`No worker found for ${host}`);
  }

  // Terminate the service worker
  await cdpConnection.send('Target.closeTarget', {
    targetId: worker.targetId
  });
}

test('can message service worker when terminated', async () => {
  await driver.get(`chrome-extension://${EXTENSION_ID}/page.html`);

  // Message without terminating service worker
  await driver.wait(until.elementLocated(By.css('button'))).click();
  await driver.wait(until.elementLocated(By.css('#response-0')));

  // Terminate service worker
  await stopServiceWorker(driver, EXTENSION_ID);

  // Try to send another message
  await driver.wait(until.elementLocated(By.css('button'))).click();
  await driver.wait(until.elementLocated(By.css('#response-1')));
});
