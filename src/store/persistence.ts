import { pruneConversations } from "../core/merge";
import { MAX_CONVERSATIONS, MAX_QUERIES_PER_CONVERSATION, SCHEMA_VERSION, type CapturedQuery, type PersistedSchemaV1 } from "../core/types";

export const STORAGE_KEY = "csr:captures:v1";
/** v1.3's flat, unversioned key -- read once for migration, never written to again. */
const LEGACY_STORAGE_KEY = "csr:capturesByConversation";

/** Conservative margin under chrome.storage.local's practical per-item size. */
const BYTE_BUDGET = 90_000;

export interface PersistResult {
    ok: boolean;
    reason?: "too_large" | "storage_error";
    /** Conversation keys dropped (oldest-first) to fit under the byte budget. */
    droppedConversations?: string[];
}

function emptyState(): PersistedSchemaV1 {
    return { schemaVersion: SCHEMA_VERSION, conversations: {} };
}

async function migrateLegacy(): Promise<PersistedSchemaV1> {
    try {
        const stored = await chrome.storage.local.get(LEGACY_STORAGE_KEY);
        const legacy = stored[LEGACY_STORAGE_KEY];
        if (legacy && typeof legacy === "object") {
            return { schemaVersion: SCHEMA_VERSION, conversations: legacy as Record<string, CapturedQuery[]> };
        }
    } catch {
        // Storage unavailable (tests / odd contexts).
    }
    return emptyState();
}

async function readState(): Promise<PersistedSchemaV1> {
    try {
        const stored = await chrome.storage.local.get(STORAGE_KEY);
        const value = stored[STORAGE_KEY];
        if (value && typeof value === "object" && (value as PersistedSchemaV1).schemaVersion === SCHEMA_VERSION) {
            return value as PersistedSchemaV1;
        }
    } catch {
        return emptyState();
    }
    // One-time, idempotent migration: the legacy key is read but never modified or deleted.
    return migrateLegacy();
}

function byteSize(value: unknown): number {
    try {
        return new TextEncoder().encode(JSON.stringify(value)).length;
    } catch {
        return Infinity;
    }
}

export async function loadPersisted(key: string): Promise<CapturedQuery[]> {
    const state = await readState();
    const rows = state.conversations[key];
    return Array.isArray(rows) ? rows.slice(0, MAX_QUERIES_PER_CONVERSATION) : [];
}

export async function savePersisted(key: string, queries: CapturedQuery[]): Promise<PersistResult> {
    const state = await readState();
    const withUpdate = { ...state.conversations, [key]: queries.slice(0, MAX_QUERIES_PER_CONVERSATION) };
    let conversations = pruneConversations(withUpdate, MAX_CONVERSATIONS, MAX_QUERIES_PER_CONVERSATION);

    // Measures the actual write payload before committing it, pruning the
    // oldest conversations further if still over budget -- replacing the
    // previous version's silent catch{} on a chrome.storage quota error.
    const droppedConversations: string[] = [];
    while (byteSize({ schemaVersion: SCHEMA_VERSION, conversations }) > BYTE_BUDGET) {
        const keys = Object.keys(conversations);
        if (keys.length <= 1) break;
        const [oldest, ...rest] = keys;
        droppedConversations.push(oldest);
        const next: Record<string, CapturedQuery[]> = {};
        rest.forEach((k) => {
            next[k] = conversations[k];
        });
        conversations = next;
    }

    try {
        await chrome.storage.local.set({ [STORAGE_KEY]: { schemaVersion: SCHEMA_VERSION, conversations } });
        return {
            ok: true,
            reason: droppedConversations.length > 0 ? "too_large" : undefined,
            droppedConversations: droppedConversations.length > 0 ? droppedConversations : undefined,
        };
    } catch {
        return { ok: false, reason: "storage_error" };
    }
}
