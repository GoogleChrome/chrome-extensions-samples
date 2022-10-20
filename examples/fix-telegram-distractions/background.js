const DEFAULT_WORK_MINUTES = 20;

let currentState = 'ON';
let enabledMessagingAt;
let enableMessagingTimeout;

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: currentState,
    });
});

const isMessagingEnabled = () => {
    if (!enabledMessagingAt) return true;

    return Date.now() >= enabledMessagingAt;
}

const clearGlobalTimeout = () => {
    enableMessagingTimeout && clearTimeout(enableMessagingTimeout);
}

const setGlobalTimeout = (handler, ms) => {
    enabledMessagingAt = Date.now() + ms

    enableMessagingTimeout = setTimeout(() => {
        handler();
        enabledMessagingAt = undefined;
    }, ms);
}

const toggleFocusMode = async (tab) => {
    if (!isMessagingEnabled()) {
        return
    }

    // We retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({tabId: tab.id});
    // Next state will always be the opposite
    const nextState = prevState === 'ON' ? 'OFF' : 'ON'

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
        tabId: tab.id,
        text: nextState,
    });

    currentState = nextState;

    await processTab(tab);
}

const processTab = async (tab) => {
    const state = currentState;

    console.log('processing', tab.url, 'focus mode', state, tab)

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
            target: {tabId: tab.id},
            function: turnFocusModeOn,
        });
    } else if (state === "OFF") {
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: turnFocusModeOff,
        });

    }

}

// when new tab is created
chrome.tabs.onCreated.addListener(function (tab) {
    processTab(tab);
});

// when a tab is updated
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    processTab(tab);
});

chrome.action.onClicked.addListener((tab) => {

    console.log('clicked', tab.url, tab);

    if (tab.url.includes("telegram")) {

        // TODO: input param
        const ms = Number(DEFAULT_WORK_MINUTES) * 60 * 1000;

        clearGlobalTimeout();
        setGlobalTimeout(() => {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: turnFocusModeOff,
            });
        }, ms);

        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: turnFocusModeOn,
        });
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: disableFor20,
        });

    } else {
        // open https://web.telegram.org in this tab
        chrome.tabs.update(tab.id, {url: "https://web.telegram.org/z/"});
    }
});

chrome.commands.onCommand.addListener((command, tab) => {

    console.log('clicked', command, tab);

    if (command === "open-dialog") {
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: searchFocus,
        });
    } else if (command === "toggle-work-mode") {
        // default action
        if (tab.url.includes("telegram")) {
            toggleFocusMode(tab);
        }
    }
});

