const ruleItemTemplate = document.getElementById('ruleItemTemplate');
const rulesList = document.getElementById('rulesList');
const addRuleButton = document.getElementById('addRuleButton');
const viewRuleButton = document.getElementById('viewRuleButton');

async function getNextRuleId() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  return Math.max(0, ...rules.map((rule) => rule.id)) + 1;
}

async function refresh() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  renderRules(rules);
}

refresh();

addRuleButton.addEventListener('click', () => {
  appendRuleItem(rulesList, {
    id: 'NEW',
    conditionType: 'urlFilter',
    conditionValue: '',
    caseSensitive: true
  });
});

viewRuleButton.addEventListener('click', async () => {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  const rulesString = JSON.stringify(rules, null, 2);
  const newWindow = window.open();
  const preElement = newWindow.document.createElement('pre');
  preElement.style.fontSize = '1rem';
  preElement.textContent = rulesString;
  newWindow.document.body.appendChild(preElement);
});

function appendRuleItem(container, initialData) {
  const { id, conditionType, conditionValue, caseSensitive } = initialData;
  // Create a new rule item from the template
  const ruleItem = ruleItemTemplate.content.cloneNode(true).children[0];
  container.appendChild(ruleItem);

  // Set the rule ID
  ruleItem.querySelector('.rule-id').value = id;

  // Set the conditionType select
  ruleItem.querySelector('.condition-type').value = conditionType;

  // set the caseSensitive input
  ruleItem.querySelector('.case-sensitive').checked = caseSensitive;

  // Set the conditionValue input
  ruleItem.querySelector('.condition-value').value = conditionValue;

  ruleItem.querySelector('.remove-rule').addEventListener('click', async () => {
    const { id } = getCurrentRuleValues(ruleItem);
    // For a new rule, just remove the item from the DOM
    if (id !== 'NEW') {
      await removeRule(id);
    }
    ruleItem.remove();
  });

  ruleItem.querySelector('.save-rule').addEventListener('click', async () => {
    const { id, conditionValue, conditionType, caseSensitive } =
      getCurrentRuleValues(ruleItem);
    const realId = id === 'NEW' ? await getNextRuleId() : id;
    await saveRule({
      id: realId,
      conditionType,
      conditionValue,
      caseSensitive
    });
    // Update the rule ID
    ruleItem.querySelector('.rule-id').value = realId;
    // Disable the save button
    setSaveButtonEnabled(ruleItem, false);
  });

  // Disable the save button
  setSaveButtonEnabled(ruleItem, false);

  // Set input change handlers
  ruleItem
    .querySelector('.condition-type')
    .addEventListener('change', verify.bind(null, ruleItem));
  ruleItem
    .querySelector('.case-sensitive')
    .addEventListener('change', verify.bind(null, ruleItem));
  ruleItem
    .querySelector('.condition-value')
    .addEventListener('change', verify.bind(null, ruleItem));
}

function setSaveButtonEnabled(ruleItem, enabled) {
  ruleItem.querySelector('.save-rule').disabled = !enabled;
}

function getCurrentRuleValues(ruleItem) {
  let id = ruleItem.querySelector('.rule-id').value;
  if (id !== 'NEW') id = parseInt(id);
  const conditionValue = ruleItem
    .querySelector('.condition-value')
    .value.trim();
  const conditionType = ruleItem.querySelector('.condition-type').value;
  const caseSensitive = ruleItem.querySelector('.case-sensitive').checked;
  return {
    id,
    conditionValue,
    conditionType,
    caseSensitive
  };
}

async function verify(ruleItem) {
  const { conditionValue, conditionType, caseSensitive } =
    getCurrentRuleValues(ruleItem);

  if (conditionValue.trim() === '') {
    // If the condition value is empty, disable the save button
    setSaveButtonEnabled(ruleItem, false);
    return;
  }
  // For the regex filter, verify if the regex is supported
  if (conditionType === 'regexFilter') {
    const result = await chrome.declarativeNetRequest.isRegexSupported({
      isCaseSensitive: caseSensitive,
      regex: conditionValue
    });
    if (!result.isSupported) {
      // If the regex is invalid, disable the save button
      setSaveButtonEnabled(ruleItem, false);
      alert(`Invalid regex: ${result.reason}`);
      return;
    }
  }

  setSaveButtonEnabled(ruleItem, true);
}

function renderRules(rules) {
  rulesList.innerHTML = '';
  for (const rule of rules) {
    // The condition can only be either url-filter or regex-filter in this sample, so it can be determined in this way.
    const conditionType = Object.keys(rule.condition).includes('urlFilter')
      ? 'urlFilter'
      : 'regexFilter';
    const caseSensitive =
      rule.condition.isUrlFilterCaseSensitive === undefined ||
      rule.condition.isUrlFilterCaseSensitive;

    appendRuleItem(rulesList, {
      id: rule.id,
      conditionType,
      caseSensitive,
      conditionValue: rule.condition[conditionType]
    });
  }
}

async function saveRule({ id, conditionType, conditionValue, caseSensitive }) {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [id],
    addRules: [
      {
        id,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'cookie',
              operation: 'remove'
            }
          ]
        },
        condition: {
          [conditionType]: conditionValue,
          isUrlFilterCaseSensitive: caseSensitive,
          resourceTypes: ['main_frame', 'xmlhttprequest']
        }
      }
    ]
  });
}

async function removeRule(id) {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [id]
  });
}
