import './styles.css';
import { InterceptedMessage } from './platforms/types';
import { createUiController } from './ui/controller';

console.log("%c[AI Search Revealer Premium UI]", "color: #00f2fe; font-weight: bold; font-size: 14px;", "Active");

const ui = createUiController({
    doc: document,
    win: window,
    sendBadgeUpdate: (count) => chrome.runtime.sendMessage({ type: "UPDATE_BADGE", count }).catch(() => { }),
});

// Enable/disable state is persisted so the toolbar toggle survives reloads.
async function initEnabledState(): Promise<void> {
    try {
        const { enabled } = await chrome.storage.local.get({ enabled: true });
        ui.setEnabled(enabled !== false);
        if (enabled !== false) ui.render();
    } catch {
        // Storage unavailable (e.g. unit tests): render by default.
        ui.render();
    }
}

// Listen for messages from the Main World (interceptor -> isolated world).
// Security: only accept same-origin messages with our exact type.
window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    const data = event.data as Partial<InterceptedMessage>;
    if (!data || data.type !== "AI_SEARCH_REVEALER_FOUND") return;
    ui.handleInterceptedMessage(data);
});

// Listen for toolbar toggle / popup messages from the service worker.
chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "SET_ENABLED") {
        ui.setEnabled(message.enabled !== false);
        return;
    }
    if (message?.type === "TOGGLE_OVERLAY") {
        const next = !ui.isEnabled();
        ui.setEnabled(next);
        chrome.storage.local.set({ enabled: next }).catch(() => { });
    }
});

// Render immediately so reviewers/users see the UI without waiting for network activity.
void initEnabledState();
