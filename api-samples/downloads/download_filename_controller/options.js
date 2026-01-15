class Rule {
  constructor(data) {
    const rules = document.getElementById('rules');
    this.node = document.getElementById('rule-template').cloneNode(true);
    this.node.id = 'rule' + Rule.next_id++;
    this.node.rule = this;
    rules.appendChild(this.node);
    this.node.hidden = false;

    if (data) {
      this.getElement('matcher').value = data.matcher;
      this.getElement('match-param').value = data.match_param;
      this.getElement('action').value = data.action;
      this.getElement('enabled').checked = data.enabled;
    }

    this.getElement('enabled-label').htmlFor = this.getElement('enabled').id =
      this.node.id + '-enabled';

    this.render();

    this.getElement('matcher').onchange = storeRules;
    this.getElement('match-param').onkeyup = storeRules;
    this.getElement('action').onchange = storeRules;
    this.getElement('enabled').onchange = storeRules;

    const rule = this;
    this.getElement('move-up').onclick = function () {
      const sib = rule.node.previousSibling;
      rule.node.parentNode.removeChild(rule.node);
      sib.parentNode.insertBefore(rule.node, sib);
      storeRules();
    };
    this.getElement('move-down').onclick = function () {
      const parentNode = rule.node.parentNode;
      const sib = rule.node.nextSibling.nextSibling;
      parentNode.removeChild(rule.node);
      if (sib) {
        parentNode.insertBefore(rule.node, sib);
      } else {
        parentNode.appendChild(rule.node);
      }
      storeRules();
    };
    this.getElement('remove').onclick = function () {
      rule.node.parentNode.removeChild(rule.node);
      storeRules();
    };
    storeRules();
  }

  getElement(name) {
    return document.querySelector('#' + this.node.id + ' .' + name);
  }

  render() {
    this.getElement('move-up').disabled = !this.node.previousSibling;
    this.getElement('move-down').disabled = !this.node.nextSibling;
  }
}

Rule.next_id = 0;

async function loadRules() {
  const { rules } = await chrome.storage.local.get('rules');
  try {
    rules.forEach(function (rule) {
      new Rule(rule);
    });
  } catch (e) {
    await chrome.storage.local.set({ rules: [] });
  }
}

async function storeRules() {
  await chrome.storage.local.set({
    rules: [...document.getElementById('rules').childNodes].map(function (
      node
    ) {
      node.rule.render();
      return {
        matcher: node.rule.getElement('matcher').value,
        match_param: node.rule.getElement('match-param').value,
        action: node.rule.getElement('action').value,
        enabled: node.rule.getElement('enabled').checked
      };
    })
  });
}

window.onload = function () {
  loadRules();
  document.getElementById('new').onclick = function () {
    new Rule();
  };
};
