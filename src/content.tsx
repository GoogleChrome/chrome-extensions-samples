import { effect } from "@preact/signals";
import { render } from "preact";
import { getChatGPTConversationId, getConversationKey } from "./core/conversationKey";
import { dbg, dumpDebug, getExtensionVersion, isContextValid } from "./debug";
import type { BackfillResultMessage, InterceptedMessage, InterceptorStatsMessage } from "./platforms/types";
import {
    announce,
    capturedQueries,
    importQueries,
    isCollapsed,
    isEnabled,
    isRestoring,
    lastError,
    networkStats,
    queryCount,
} from "./store/captures";
import { loadPersisted, savePersisted } from "./store/persistence";
import { OverlayRoot } from "./ui/components/OverlayRoot";
import { createMounter } from "./ui/mount";

// Mutable, not const: these are all SPAs (ChatGPT/Claude/Gemini) where switching
// between conversations changes the URL via the History API without a full page
// reload -- the content script never re-runs, so this must be updated in place
// by pollForConversationChange() below, not frozen at script-load time. (Found
// live 2026-10-08: without this, switching conversations silently kept
// saving/loading against whichever conversation was active when the tab first
// loaded, making the overlay appear "stuck" on stale data.)
let conversationKey = getConversationKey(window);

dbg("info", "boot", `content script loaded, ext=${getExtensionVersion()}`, `contextValid=${isContextValid()}`, `key=${conversationKey}`);

if (!isContextValid()) {
    dbg(
        "error",
        "boot",
        "Extension context INVALID (extension was reloaded with this tab open).",
        "chrome.storage / messaging will fail. HARD-REFRESH this tab to fix."
    );
}

const { ensureMount, dropCache } = createMounter(document);

function renderUI(): void {
    const mount = ensureMount();
    if (!mount) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", renderUI, { once: true });
        } else {
            requestAnimationFrame(renderUI);
        }
        return;
    }
    render(<OverlayRoot doc={document} win={window} />, mount);
}

// The only place a signal read drives a *structural* DOM change outside
// Preact's own reactivity: when disabled, the mount point is torn down
// entirely (not just rendered empty), so there is zero DOM footprint.
effect(() => {
    if (!isEnabled.value) {
        document.getElementById("csr-root")?.remove();
        dropCache();
        return;
    }
    renderUI();
});

// Badge count follows capturedQueries automatically via this effect; all
// other UI reactivity (filters, collapse state, etc.) happens for free
// inside Preact components that read the store's signals directly.
effect(() => {
    const count = queryCount.value;
    chrome.runtime.sendMessage({ type: "UPDATE_BADGE", count }).catch(() => {});
});

// Debounced persistence: storage writes during a streaming burst are
// coalesced into one write 800ms after the last change.
let saveTimer: number | undefined;
effect(() => {
    const queries = capturedQueries.value;
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
        void savePersisted(conversationKey, queries).then((result) => {
            if (!result.ok) {
                lastError.value = { message: "Storage error — this conversation's captures may not be saved.", tone: "error" };
            } else if (result.reason === "too_large") {
                lastError.value = { message: "Storage limit reached — the oldest conversation was dropped to make room.", tone: "warning" };
            }
        });
    }, 800);
});

/**
 * Asks the already-loaded MAIN-world interceptor to re-fetch and re-parse a
 * conversation, instead of content.ts hand-duplicating a parser (today's
 * conversation.ts does this because Rollup can't safely share platforms/*
 * between two entries -- see src/platforms/types.ts).
 */
function requestBackfill(platform: string, conversationId: string): void {
    const message = { type: "AI_SEARCH_REVEALER_REQUEST_BACKFILL" as const, platform, conversationId };
    try {
        window.postMessage(message, window.location.origin);
    } catch {
        // Best-effort; the live hook remains the primary capture path.
    }
}

/**
 * Loads a conversation's persisted captures into the store and kicks off
 * ChatGPT backfill for it. Shared by init() (first load) and
 * switchConversation() (SPA navigation to a different conversation) so both
 * paths restore/backfill identically.
 */
async function restoreConversation(key: string): Promise<void> {
    // Stale-while-revalidating: only show the loading skeleton if the
    // storage restore takes long enough to notice (~400ms); the common case
    // (fast restore, or nothing to restore) never flashes it.
    let restoreDone = false;
    window.setTimeout(() => {
        if (!restoreDone) isRestoring.value = true;
    }, 400);

    try {
        const restored = await loadPersisted(key);
        if (restored.length > 0) {
            importQueries(restored);
        }
    } catch (e) {
        dbg("warn", "restoreConversation", "restore failed, starting empty", String(e));
    } finally {
        restoreDone = true;
        isRestoring.value = false;
    }

    // Backfill covers turns that streamed before the extension was
    // installed/reloaded (or before this conversation was switched into).
    // Best-effort: retried a few times since the stream is often still in
    // flight right after a switch.
    const chatGptId = getChatGPTConversationId(window);
    if (chatGptId) {
        requestBackfill("ChatGPT", chatGptId);
        let attempts = 0;
        const retryTimer = window.setInterval(() => {
            attempts += 1;
            if (attempts > 6 || capturedQueries.value.length > 0) {
                window.clearInterval(retryTimer);
                return;
            }
            requestBackfill("ChatGPT", chatGptId);
        }, 15000);
    }
}

/**
 * Called when polling (below) notices the URL now points at a different
 * conversation. Flushes the outgoing conversation's captures immediately
 * (doesn't wait for the debounced save-effect's timer, which may not have
 * fired yet), clears the in-memory list, then restores the new conversation's
 * own history. Without this, the overlay kept showing/saving against
 * whichever conversation was active when the tab first loaded -- switching
 * conversations in the sidebar did nothing, since the content script only
 * runs once per real page load, not per SPA route change.
 *
 * `conversationKey` is reassigned synchronously, before the first `await`:
 * otherwise a second poll tick firing while `savePersisted` is still in
 * flight would see the stale key, decide a switch is still pending, and
 * kick off a second overlapping switchConversation() call.
 */
async function switchConversation(nextKey: string): Promise<void> {
    const outgoingKey = conversationKey;
    const outgoingQueries = capturedQueries.value;
    conversationKey = nextKey;
    capturedQueries.value = [];
    dbg("info", "switchConversation", `${outgoingKey} -> ${nextKey}`);

    window.clearTimeout(saveTimer);
    await savePersisted(outgoingKey, outgoingQueries);
    await restoreConversation(nextKey);
}

/**
 * ChatGPT/Claude/Gemini are all client-side-routed SPAs: clicking a different
 * conversation in the sidebar changes the URL via the History API without a
 * full page load, so this content script never re-runs and never otherwise
 * notices. Polling location/pathname here is simpler and more robust than
 * monkey-patching history.pushState/replaceState, which risks interop issues
 * with each site's own router.
 */
function pollForConversationChange(): void {
    window.setInterval(() => {
        const nextKey = getConversationKey(window);
        if (nextKey === conversationKey) return;
        void switchConversation(nextKey);
    }, 1000);
}

async function init(): Promise<void> {
    let enabled = true;
    try {
        const stored = await chrome.storage.local.get({ enabled: true });
        enabled = stored.enabled !== false;
    } catch {
        enabled = true;
    }
    isEnabled.value = enabled;
    if (!enabled) {
        dbg("info", "init", "overlay disabled by toolbar toggle — click the toolbar icon to re-enable.");
        return;
    }

    await restoreConversation(conversationKey);
    pollForConversationChange();
}

// Listen for messages from the MAIN world (interceptor -> isolated world).
// Security: only accept same-origin messages with our exact type.
window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    const raw: unknown = event.data;
    if (!raw || typeof raw !== "object") return;
    const data = raw as Partial<InterceptedMessage> & Partial<InterceptorStatsMessage> & Partial<BackfillResultMessage>;

    if (data.type === "AI_SEARCH_REVEALER_STATS") {
        if (typeof data.seen === "number" && typeof data.matched === "number") {
            networkStats.value = { seen: data.seen, matched: data.matched };
        }
        return;
    }

    if (data.type === "AI_SEARCH_REVEALER_BACKFILL_RESULT") {
        if (Array.isArray(data.results) && data.results.length > 0 && typeof data.conversationId === "string") {
            const withContext = data.results.map((r) => ({
                ...r,
                platform: data.platform,
                conversationId: data.conversationId,
                timestamp: Date.now(),
            }));
            if (importQueries(withContext)) {
                announce(`${data.results.length} ${data.results.length === 1 ? "query" : "queries"} restored`);
            }
        }
        return;
    }

    if (data.type !== "AI_SEARCH_REVEALER_FOUND") return;
    if (!Array.isArray(data.results) || data.results.length === 0) return;
    const withContext = data.results.map((r) => ({
        ...r,
        platform: data.platform,
        conversationId: data.conversationId,
        timestamp: Date.now(),
    }));
    if (importQueries(withContext)) {
        announce(`${data.results.length} new ${data.results.length === 1 ? "query" : "queries"} captured`);
    }
});

// Listen for toolbar toggle / popup messages from the service worker.
chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "SET_ENABLED") {
        isEnabled.value = message.enabled !== false;
        return;
    }
    if (message?.type === "TOGGLE_OVERLAY") {
        const next = !isEnabled.value;
        isEnabled.value = next;
        chrome.storage.local.set({ enabled: next }).catch(() => {});
    }
});

// Console debug handle: window.__AI_SEARCH_REVEALER__.dump() prints the full
// staged log; .state() shows live store status.
try {
    (window as unknown as Record<string, unknown>).__AI_SEARCH_REVEALER__ = {
        version: getExtensionVersion(),
        dump: dumpDebug,
        state: () => ({
            version: getExtensionVersion(),
            contextValid: isContextValid(),
            conversationKey,
            enabled: isEnabled.value,
            collapsed: isCollapsed.value,
            capturedQueries: capturedQueries.value,
        }),
    };
} catch {
    // Non-critical.
}

void init();
