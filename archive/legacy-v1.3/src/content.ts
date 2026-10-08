import './styles.css';
import { InterceptedMessage, InterceptorStatsMessage } from './platforms/types';
import { createUiController } from './ui/controller';
import {
    backfillChatGPT,
    getChatGPTConversationId,
    getConversationKey,
    loadPersisted,
    savePersisted,
    type PersistedQuery,
} from './conversation';
import { dbg, dumpDebug, getExtensionVersion, isContextValid } from './debug';

const conversationKey = getConversationKey(window);
let saveTimer: number | undefined;

dbg("info", "boot", `content script loaded, ext=${getExtensionVersion()}`, `contextValid=${isContextValid()}`, `key=${conversationKey}`);

if (!isContextValid()) {
    dbg("error", "boot", "Extension context INVALID (extension was reloaded with this tab open).",
        "chrome.storage / messaging will fail. HARD-REFRESH this tab to fix.");
}

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

// Console debug handle: window.__AI_SEARCH_REVEALER__.dump() prints the full
// staged log; .state() shows live controller + storage status.
try {
    (window as unknown as Record<string, unknown>).__AI_SEARCH_REVEALER__ = {
        version: getExtensionVersion(),
        dump: dumpDebug,
        state: () => ({
            version: getExtensionVersion(),
            contextValid: isContextValid(),
            conversationKey,
            ...ui.getState(),
            hostPresent: !!document.getElementById("csr-root"),
            shadowAttached: !!(document.getElementById("csr-root") as HTMLDivElement | null)?.shadowRoot,
        }),
    };
} catch {
    // Non-critical.
}

// Enable/disable state is persisted so the toolbar toggle survives reloads.
async function init(): Promise<void> {
    let enabled = true;
    try {
        const stored = await chrome.storage.local.get({ enabled: true });
        enabled = stored.enabled !== false;
        dbg("info", "init", `storage enabled=${enabled}`);
    } catch (e) {
        dbg("warn", "init", "storage read failed, defaulting enabled=true", String(e));
        enabled = true;
    }
    ui.setEnabled(enabled);
    if (!enabled) {
        dbg("info", "init", "overlay disabled by toolbar toggle — nothing will render. Click the toolbar icon to re-enable.");
        return;
    }

    // 1. Restore this conversation's captures (fixes refresh-loss).
    try {
        const restored = await loadPersisted(conversationKey);
        dbg("info", "init", `restored ${restored.length} persisted queries for ${conversationKey}`);
        if (restored.length > 0) {
            ui.importQueries(restored.map((q) => ({ ...q })));
        } else {
            ui.render();
        }
    } catch (e) {
        dbg("warn", "init", "restore failed, rendering empty", String(e));
        ui.render();
    }
    dbg("info", "init", `rendered. hostPresent=${!!document.getElementById("csr-root")}`,
        `visibleQueries=${ui.getState().capturedQueries.length}`);

    // 2. Backfill from ChatGPT's persistent conversation object (covers turns
    // that streamed before the extension was installed/reloaded).
    // Same-origin fetch, session cookies included, no extra permissions.
    // Retried with backoff: at load time the stream is often still running,
    // so the mapping has no fanout fields yet.
    const runBackfill = async (attempt: string): Promise<boolean> => {
        try {
            dbg("info", "backfill", `requesting conversation object… (${attempt})`);
            const backfill = await backfillChatGPT(window);
            if (backfill && backfill.results.length > 0) {
                dbg("info", "backfill", `got ${backfill.results.length} queries for ${backfill.conversationId} (${attempt})`);
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
                return true;
            }
            dbg("info", "backfill", `no results (${attempt}) — not a /c/ page, gated endpoint, or stream still running`);
            return false;
        } catch (e) {
            // Backfill is best-effort (logged out, rate-limited, renamed endpoint).
            dbg("warn", "backfill", `failed (${attempt}, best-effort, safe to ignore)`, String(e));
            return false;
        }
    };

    const found = await runBackfill("attempt 1/7");
    if (!found && getChatGPTConversationId(window)) {
        // Stream likely still in flight: retry in the background, stop early
        // once anything is captured (live hook usually beats us to it).
        let attempts = 0;
        const retryTimer = window.setInterval(async () => {
            attempts++;
            if (attempts > 6 || ui.getState().capturedQueries.length > 0) {
                window.clearInterval(retryTimer);
                return;
            }
            if (await runBackfill(`retry ${attempts}/6`)) {
                window.clearInterval(retryTimer);
            }
        }, 15000);
    }
}

// Listen for messages from the Main World (interceptor -> isolated world).
// Security: only accept same-origin messages with our exact type.
window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    const raw: unknown = event.data;
    if (!raw || typeof raw !== "object") return;
    const data = raw as Partial<InterceptedMessage> & Partial<InterceptorStatsMessage>;
    // Fetch-monitor heartbeat: proves the MAIN-world hook is alive and shows
    // whether any traffic matched (seen>0/matched=0 means endpoint drift).
    if (data.type === "AI_SEARCH_REVEALER_STATS") {
        if (typeof data.seen === "number" && typeof data.matched === "number") {
            ui.setNetworkStats({ seen: data.seen, matched: data.matched });
        }
        return;
    }
    if (data.type !== "AI_SEARCH_REVEALER_FOUND") return;
    dbg("info", "capture", `received ${data.results?.length ?? 0} queries from ${data.platform ?? "unknown"}`);
    ui.handleInterceptedMessage(data);
});

// Listen for toolbar toggle / popup messages from the service worker.
chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "SET_ENABLED") {
        dbg("info", "toolbar", `SET_ENABLED enabled=${message.enabled}`);
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
