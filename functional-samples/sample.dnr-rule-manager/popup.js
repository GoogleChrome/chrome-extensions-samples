document.getElementById('openManagerTab').addEventListener('click', () => {
  chrome.tabs.create({ url: 'manager.html' });
});

const matchedRulesList = document.getElementById('matchedRulesList');

async function init() {
  const tabId = (await chrome.tabs.query({ active: true }))[0].id;
  const result = await chrome.declarativeNetRequest.getMatchedRules({ tabId });
  if (result.rulesMatchedInfo.length === 0) {
    document.querySelector('.tips').style.display = 'block';
    return;
  }
  document.querySelector('.matched-rules').style.display = 'block';
  for (const item of result.rulesMatchedInfo) {
    let element = document.createElement('p');
    element.innerText = `${new Date(
      item.timeStamp
    ).toLocaleString()} - RuleId: ${item.rule.ruleId}`;
    matchedRulesList.appendChild(element);
  }
}

init();
