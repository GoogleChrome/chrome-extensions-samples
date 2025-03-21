let failTimeout;
let moleShowing = false;
let controllerId;

chrome.action.onClicked.addListener(() => {
  if (!moleShowing) return;

  chrome.runtime.sendMessage(controllerId, 'success');
  hideMole();

  failTimeout && clearTimeout(failTimeout);
  failTimeout = undefined;
});

function showMole() {
  chrome.action.setIcon({ path: 'icon-mole.png' });
  moleShowing = true;
}

function hideMole() {
  chrome.action.setIcon({ path: 'icon-empty.png' });
  moleShowing = false;
}

chrome.runtime.onMessageExternal.addListener((msg) => {
  controllerId = msg.id;
  showMole();
  failTimeout = setTimeout(async () => {
    hideMole();
    const tabs = await chrome.tabs.query({});
    const eligibleTabs = tabs.filter((t) => t.title.includes('Example'));

    if (eligibleTabs.length > 0) {
      // const tabToClose = Math.floor(Math.random() * eligibleTabs.length);
      // chrome.tabs.remove(eligibleTabs[tabToClose].id);
    }
  }, 2000);
});
