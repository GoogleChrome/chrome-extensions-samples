
let currentState = 'ON';

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: currentState,
  });
});

function turnFocusModeOn() {
  const DEFAULT_TAB_INDEX = 1

  // const hideTabs = () => {
  // window.interval = setInterval(() => {
  document.querySelector('.unread-count')?.classList.add('hidden');

  for (let tab of document.querySelector('.TabList').children) {
    tab.classList.add('hidden')
  }

  const tablist = document.querySelector('.ChatFolders .TabList');

  tablist.style = 'height: 0px;';
  // }, 500);

  const selectTab = (tabIndex) => {
    document.querySelector('.TabList').children[tabIndex].click();
  }

  setTimeout(() => selectTab(DEFAULT_TAB_INDEX), 200);
  // }

  // hideTabs();

  // document.addEventListener('DOMContentLoaded', hideTabs);
}

function turnFocusModeOff() {
  // if (window.interval) {
  //   clearInterval(window.interval);
  // }

  document.querySelector('.unread-count')?.classList.remove('hidden');

  for (let tab of document.querySelector('.TabList').children) {
    tab.classList.remove('hidden')
  }

  const tablist = document.querySelector('.ChatFolders .TabList');

  tablist.style = '';

}

const toggleFocusMode = async (tab) => {
  // We retrieve the action badge to check if the extension is 'ON' or 'OFF'
  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  // Next state will always be the opposite
  const nextState = prevState === 'ON' ? 'OFF' : 'ON'

  // Set the action badge to the next state
  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: nextState,
  });

  currentState = nextState;

  processTab(tab);
}

const processTab = async (tab, state = currentState) => {

  console.log('opened', tab.url, tab)

  if (!tab || !tab.url) {
    return
  }

  // if the tab is a telegram tab
  if (!tab.url.includes("telegram")) {
    return
  }

  if (state === "ON") {
    // execute the script
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: turnFocusModeOn,
    });
  } else if (state === "OFF") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: turnFocusModeOff,
    });

  }

}

// when new tab is created
chrome.tabs.onCreated.addListener(function (tab) {
  processTab(tab, currentState);
});

// when a tab is updated
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  processTab(tab, currentState);
});

chrome.action.onClicked.addListener((tab) => {
  // TODO: Add a way to toggle the extension on and off

  console.log('clicked', tab.url, tab);

  if (tab.url.includes("telegram")) {
    toggleFocusMode(tab);
  } else {
    // open https://web.telegram.org in this tab
    chrome.tabs.update(tab.id, { url: "https://web.telegram.org/z/" });
  }
});
