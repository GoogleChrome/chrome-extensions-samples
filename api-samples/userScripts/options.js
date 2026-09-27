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

const USER_SCRIPT_ID = 'default';
const EXAMPLE_MATCH_PATTERN = 'https://example.com/*';
const EXAMPLE_ORIGIN = 'https://example.com/';
const SAVE_BUTTON_ID = 'save-button';
const EXECUTE_BUTTON_ID = 'execute-button';
const EXECUTE_RESULT_ID = 'execute-result';

const FORM_ID = 'settings-form';
const FORM = document.getElementById(FORM_ID);

const TYPE_INPUT_NAME = 'type';
const SCRIPT_TEXTAREA_NAME = 'custom-script';
const EXECUTE_TEXTAREA_NAME = 'execute-script';
const DEFAULT_EXECUTE_SCRIPT = [
  "document.body.style.outline = '4px solid #1a73e8';",
  "document.body.dataset.userScriptsExecute = 'true';",
  "'done';"
].join('\n');

/**
 * Checks if the user has developer mode enabled, which is required to use the
 * User Scripts API.
 *
 * @returns If the chrome.userScripts API is available.
 */
function isUserScriptsAvailable() {
  try {
    // Property access throws in older Chrome versions when developer mode is
    // disabled, and newer versions expose the API as undefined until the user
    // enables the Allow User Scripts toggle.
    if (!chrome.userScripts) throw new Error();
    document.getElementById('warning').style.display = 'none';
    FORM.style.display = 'block';
    return true;
  } catch {
    // Not available, so hide UI and show error.
    document.getElementById('warning').style.display = 'block';
    FORM.style.display = 'none';
    return false;
  }
}

function getScriptSource(type, script) {
  return type === 'file' ? [{ file: 'user-script.js' }] : [{ code: script }];
}

function setExecuteResult(message, isError = false) {
  const result = document.getElementById(EXECUTE_RESULT_ID);
  result.textContent = message;
  result.toggleAttribute('data-error', isError);
}

async function getTargetTab() {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (activeTab?.id && activeTab.url?.startsWith(EXAMPLE_ORIGIN)) {
    return activeTab;
  }

  const [exampleTab] = await chrome.tabs.query({ url: EXAMPLE_MATCH_PATTERN });
  return exampleTab;
}

async function updateUi() {
  if (!isUserScriptsAvailable()) return;

  // Access settings from storage with default values.
  const { type, script, executeScript } = await chrome.storage.local.get({
    type: 'file',
    script: "alert('hi');",
    executeScript: DEFAULT_EXECUTE_SCRIPT
  });

  // Update UI with current values.
  FORM.elements[TYPE_INPUT_NAME].value = type;
  FORM.elements[SCRIPT_TEXTAREA_NAME].value = script;
  FORM.elements[EXECUTE_TEXTAREA_NAME].value = executeScript;
}

async function onSave() {
  if (!isUserScriptsAvailable()) return;

  // Get values from form.
  const type = FORM.elements[TYPE_INPUT_NAME].value;
  const script = FORM.elements[SCRIPT_TEXTAREA_NAME].value;

  // Save to storage.
  await chrome.storage.local.set({
    type,
    script
  });

  const existingScripts = await chrome.userScripts.getScripts({
    ids: [USER_SCRIPT_ID]
  });

  if (existingScripts.length > 0) {
    // Update existing script.
    await chrome.userScripts.update([
      {
        id: USER_SCRIPT_ID,
        matches: ['https://example.com/*'],
        js: getScriptSource(type, script)
      }
    ]);
  } else {
    // Register new script.
    await chrome.userScripts.register([
      {
        id: USER_SCRIPT_ID,
        matches: ['https://example.com/*'],
        js: getScriptSource(type, script)
      }
    ]);
  }
}

async function onExecute() {
  if (!isUserScriptsAvailable()) return;

  const executeScript = FORM.elements[EXECUTE_TEXTAREA_NAME].value.trim();
  if (!executeScript) {
    setExecuteResult('Enter script text to execute.', true);
    return;
  }

  await chrome.storage.local.set({ executeScript });

  const tab = await getTargetTab();
  if (!tab?.id) {
    setExecuteResult('Open https://example.com/ in a tab first.', true);
    return;
  }

  try {
    const results = await chrome.userScripts.execute({
      target: { tabId: tab.id },
      js: [{ code: executeScript }]
    });
    const errors = results
      .filter((result) => result.error)
      .map((result) => result.error);

    if (errors.length > 0) {
      setExecuteResult(errors.join('\n'), true);
      return;
    }

    const result = results.find(({ result }) => result !== undefined);
    const resultText = result
      ? ` Result: ${JSON.stringify(result.result)}`
      : '';
    setExecuteResult(`Executed in ${results.length} frame(s).${resultText}`);
  } catch (error) {
    setExecuteResult(error.message, true);
  }
}

// Update UI immediately, and on any storage changes.
updateUi();
chrome.storage.local.onChanged.addListener(updateUi);

// Register listener for save button click.
document.getElementById(SAVE_BUTTON_ID).addEventListener('click', onSave);
document.getElementById(EXECUTE_BUTTON_ID).addEventListener('click', onExecute);
