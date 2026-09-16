import './styles.css';
import { InterceptedMessage } from './platforms/types';
import { createUiController } from './ui/controller';
import {
    backfillChatGPT,
    getConversationKey,
    loadPersisted,
    savePersisted,
    type PersistedQuery,
} from './conversation';

console.log("%c[AI Search Revealer Premium UI]", "color: #00f2fe; font-weight: bold; font-size: 14px;", "Active");

const conversationKey = getConversationKey(window);
let saveTimer: number | undefined;

const ui = createUiController({
    doc: document,
    win: window,
    sendBadgeUpdate: (count) => chrome.runtime.sendMessage({ type: "UPDATE_BADGE", count }).catch(() => { }),
    initialQueries: [],
    onQueriesChanged: (queries) => {
        // Debounce storage writes during streaming bursts.
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => {
            void savePersisted(conversationKey, queries as PersistedQuery[]);
        }, 800);
    },
});

// Enable/disable state is persisted so the toolbar toggle survives reloads.
async function init(): Promise<void> {
    let enabled = true;
    try {
        const stored = await chrome.storage.local.get({ enabled: true });
        enabled = stored.enabled !== false;
    } catch {
        enabled = true;
    }
    ui.setEnabled(enabled);
    if (!enabled) return;

    // 1. Restore this conversation's captures (fixes refresh-loss).
    try {
        const restored = await loadPersisted(conversationKey);
        if (restored.length > 0) {
            ui.importQueries(restored.map((q) => ({ ...q })));
        } else {
            ui.render();
        }
    } catch {
        ui.render();
    }

    // 2. Backfill from ChatGPT's persistent conversation object (covers turns
    // that streamed before the extension was installed/reloaded).
    // Same-origin fetch, session cookies included, no extra permissions.
    try {
        const backfill = await backfillChatGPT(window);
        if (backfill && backfill.results.length > 0) {
            ui.importQueries(
                backfill.results.map((r) => ({
                    text: r.text,
                    platform: "ChatGPT",
                    timestamp: Date.now(),
                    sources: r.sources,
                    searchEngine: r.searchEngine,
                    turnUseCase: r.turnUseCase,
                    modelSlug: r.modelSlug,
                    workingTurnId: r.workingTurnId,
                    conversationId: backfill.conversationId,
                }))
            );
        }
    } catch {
        // Backfill is best-effort (logged out, rate-limited, renamed endpoint).
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
void init();
