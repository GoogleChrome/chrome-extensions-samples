// Background Service Worker for AI Search Revealer
// Single purpose: reveal hidden search queries + offer user-initiated research actions.

const DISABLED_COLOR = "#6b7280";

// --- Badge updates (from content script) ---
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "UPDATE_BADGE" && sender.tab?.id) {
        const count = message.count.toString();
        chrome.action.setBadgeText({
            text: count,
            tabId: sender.tab.id
        });
        chrome.action.setBadgeBackgroundColor({
            color: "#00f2fe",
            tabId: sender.tab.id
        });
    }
});

async function applyActionState(enabled: boolean): Promise<void> {
    try {
        await chrome.action.setTitle({
            title: enabled ? "AI Search Revealer (enabled — click to disable)" : "AI Search Revealer (disabled — click to enable)"
        });
        await chrome.action.setBadgeBackgroundColor({
            color: enabled ? "#00f2fe" : DISABLED_COLOR
        });
    } catch {
        // Ignore (e.g. during install when action is not ready).
    }
}

// --- Toolbar click toggles the overlay (gives the action button a function) ---
chrome.action.onClicked.addListener(async (tab) => {
    let enabled = true;
    try {
        const stored = await chrome.storage.local.get({ enabled: true });
        enabled = stored.enabled !== false;
    } catch {
        enabled = true;
    }
    const next = !enabled;
    try {
        await chrome.storage.local.set({ enabled: next });
    } catch {
        // Storage unavailable; still try to notify the tab.
    }
    await applyActionState(next);
    if (tab?.id) {
        try {
            await chrome.tabs.sendMessage(tab.id, { type: "SET_ENABLED", enabled: next });
            if (!next) {
                await chrome.action.setBadgeText({ text: "", tabId: tab.id });
            }
        } catch {
            // Tab may not have the content script (e.g. chrome:// pages). Ignore.
        }
    }
});

// --- Setup: defaults + Context Menus ---
chrome.runtime.onInstalled.addListener(async () => {
    try {
        const stored = await chrome.storage.local.get("enabled");
        if (stored.enabled === undefined) {
            await chrome.storage.local.set({ enabled: true });
        }
    } catch {
        // Ignore storage errors during install.
    }
    await applyActionState(true);

    // Re-create menus idempotently (onInstalled may fire on update).
    try { await chrome.contextMenus.removeAll(); } catch { /* ignore */ }
    chrome.contextMenus.create({
        id: "search-on-google",
        title: "Verify with Google Search",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: "explain-with-chatgpt",
        title: "Explain with ChatGPT",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info) => {
    if (!info.selectionText) return;

    const encodedText = encodeURIComponent(info.selectionText);

    if (info.menuItemId === "search-on-google") {
        chrome.tabs.create({ url: `https://www.google.com/search?q=${encodedText}` });
    } else if (info.menuItemId === "explain-with-chatgpt") {
        chrome.tabs.create({ url: `https://chatgpt.com/?q=${encodedText}` });
    }
});

console.log("[AI Search Revealer] Background Script Loaded");
