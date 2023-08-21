const ruleItemTemplate = document.getElementById('ruleItemTemplate');
const rulesList = document.getElementById('rulesList');
const addRuleButton = document.getElementById('addRuleButton');
const viewRuleButton = document.getElementById('viewRuleButton');

async function getNextRuleId() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  return Math.max(...rules.map((rule) => rule.id)) + 1;
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
  newWindow.document.write(
    `<pre style="font-size: 1rem;">${rulesString}</pre>`
  );
});

function appendRuleItem(
  container,
  { id, conditionType, conditionValue, caseSensitive }
) {
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

  // Set button click handlers
  function getCurrentRuleValues() {
    const conditionValue = ruleItem
      .querySelector('.condition-value')
      .value.trim();
    const conditionType = ruleItem.querySelector('.condition-type').value;
    const caseSensitive = ruleItem.querySelector('.case-sensitive').checked;
    return {
      conditionValue,
      conditionType,
      caseSensitive
    };
  }
  ruleItem.querySelector('.remove-rule').addEventListener('click', async () => {
    // For a new rule, just remove the item from the DOM
    if (id !== 'NEW') {
      await removeRule(id);
    }
    ruleItem.remove();
  });
  ruleItem.querySelector('.save-rule').addEventListener('click', async () => {
    const {
      conditionValue: _conditionValue,
      conditionType: _conditionType,
      caseSensitive: _caseSensitive
    } = getCurrentRuleValues();
    const _id = id === 'NEW' ? await getNextRuleId() : id;
    await saveRule({
      id: _id,
      conditionType: _conditionType,
      conditionValue: _conditionValue,
      caseSensitive: _caseSensitive
    });
    // Update the rule ID
    ruleItem.querySelector('.rule-id').value = _id;
    // Disable the save button
    setSaveButtonEnabled(false);
    // Update parameter
    id = _id;
    conditionType = _conditionType;
    conditionValue = _conditionValue;
    caseSensitive = _caseSensitive;
  });

  // Disable the save button
  function setSaveButtonEnabled(enabled) {
    ruleItem.querySelector('.save-rule').disabled = !enabled;
  }
  setSaveButtonEnabled(false);

  // Set input change handlers
  async function verify() {
    const {
      conditionValue: _conditionValue,
      conditionType: _conditionType,
      caseSensitive: _caseSensitive
    } = getCurrentRuleValues();

    if (
      conditionValue === _conditionValue &&
      caseSensitive === _caseSensitive &&
      conditionType === _conditionType
    ) {
      // If the rule is not changed, disable the save button
      setSaveButtonEnabled(false);
      return;
    }
    if (_conditionValue.trim() === '') {
      // If the condition value is empty, disable the save button
      setSaveButtonEnabled(false);
      return;
    }
    // For the regex filter, verify if the regex is supported
    if (_conditionType === 'regexFilter') {
      const result = await chrome.declarativeNetRequest.isRegexSupported({
        isCaseSensitive: _caseSensitive,
        regex: _conditionValue
      });
      if (!result.isSupported) {
        // If the regex is invalid, disable the save button
        setSaveButtonEnabled(false);
        alert(`Invalid regex: ${result.reason}`);
        return;
      }
    }

    setSaveButtonEnabled(true);
  }
  ruleItem.querySelector('.condition-type').addEventListener('change', verify);
  ruleItem.querySelector('.case-sensitive').addEventListener('change', verify);
  ruleItem.querySelector('.condition-value').addEventListener('change', verify);
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
