// NOTE: this module must not import from ./platforms/*.
// Vite builds each content-script entry independently; a shared import would
// split a `chatgpt.js` chunk that content scripts cannot reliably load.
// The backfill parser below is intentionally standalone and minimal.

export const CAPTURES_KEY = "csr:capturesByConversation";
const MAX_CONVERSATIONS = 20;
const MAX_QUERIES_PER_CONVERSATION = 100;

export type BackfillSource = {
    url: string;
    title?: string;
    snippet?: string;
    attribution?: string;
    pubDate?: string;
    resultSource?: string;
    cited?: boolean;
};

export type BackfillResult = {
    text: string;
    sources?: BackfillSource[];
    searchEngine?: string;
    turnUseCase?: string;
    modelSlug?: string;
    workingTurnId?: string;
};

export type PersistedQuery = {
    text: string;
    platform?: string;
    timestamp: number;
    sources?: BackfillSource[];
    searchEngine?: string;
    turnUseCase?: string;
    modelSlug?: string;
    workingTurnId?: string;
    conversationId?: string;
};

/** Parse a stable per-conversation key from the page URL. ChatGPT uses /c/{id}; others fall back to host+path. */
export function getConversationKey(win: Window): string {
    try {
        const url = new URL(win.location.href);
        const chatMatch = url.pathname.match(/\/c\/([a-f0-9-]+)/i);
        if (chatMatch?.[1]) return `chatgpt:${chatMatch[1]}`;
        const path = `${url.hostname}${url.pathname}`.replace(/\/+$/, "").slice(0, 120);
        return path || url.hostname;
    } catch {
        return "default";
    }
}

/** Raw ChatGPT conversation id (uuid) or null when not on a /c/ page. */
export function getChatGPTConversationId(win: Window): string | null {
    try {
        const url = new URL(win.location.href);
        const m = url.pathname.match(/\/c\/([a-f0-9-]+)/i);
        return m?.[1] ?? null;
    } catch {
        return null;
    }
}

type CapturesMap = Record<string, PersistedQuery[]>;

async function readMap(): Promise<CapturesMap> {
    try {
        const { [CAPTURES_KEY]: map } = await chrome.storage.local.get(CAPTURES_KEY);
        if (map && typeof map === "object") return map as CapturesMap;
    } catch {
        // Storage unavailable (tests / odd contexts).
    }
    return {};
}

export async function loadPersisted(key: string): Promise<PersistedQuery[]> {
    const map = await readMap();
    const rows = map[key];
    return Array.isArray(rows) ? rows.slice(0, MAX_QUERIES_PER_CONVERSATION) : [];
}

export async function savePersisted(key: string, queries: PersistedQuery[]): Promise<void> {
    try {
        const map = await readMap();
        map[key] = queries.slice(0, MAX_QUERIES_PER_CONVERSATION);
        // Prune oldest conversations (object insertion order = oldest first).
        const keys = Object.keys(map);
        while (keys.length > MAX_CONVERSATIONS) {
            const oldest = keys.shift();
            if (oldest) delete map[oldest];
        }
        await chrome.storage.local.set({ [CAPTURES_KEY]: map });
    } catch {
        // Ignore quota / unavailable storage.
    }
}

const str = (v: unknown, max = 300): string | undefined => {
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    if (!t) return undefined;
    return t.length > max ? t.slice(0, max) : t;
};

/** Minimal standalone walk of a GET /backend-api/conversation/{id} payload. */
export function extractBackfillFromPayload(root: unknown): BackfillResult[] {
    const queries = new Set<string>();
    const sources = new Map<string, BackfillSource>();
    let turnUseCase: string | undefined;
    let modelSlug: string | undefined;
    let workingTurnId: string | undefined;
    let searchEngine: string | undefined;

    const addSource = (url: unknown, title?: unknown, extra?: Partial<BackfillSource>, cited?: boolean): void => {
        if (typeof url !== "string" || !url) return;
        const existing = sources.get(url);
        if (existing) {
            if (cited) existing.cited = true;
            if (extra?.snippet && !existing.snippet) existing.snippet = extra.snippet;
            return;
        }
        let fallback = url;
        try { fallback = new URL(url).hostname; } catch { /* keep raw */ }
        sources.set(url, {
            url,
            title: typeof title === "string" && title ? title : fallback,
            snippet: extra?.snippet,
            cited: cited ?? false,
        });
    };

    const collectQueries = (value: unknown): void => {
        if (Array.isArray(value)) {
            value.forEach((item) => {
                if (typeof item === "string" && item.trim()) queries.add(item.trim());
                else if (item && typeof item === "object") {
                    const r = item as Record<string, unknown>;
                    if (typeof r.query === "string" && r.query.trim()) queries.add(r.query.trim());
                    collectQueries(r.queries);
                }
            });
            return;
        }
        if (value && typeof value === "object") {
            const r = value as Record<string, unknown>;
            collectQueries(r.queries);
        }
    };

    const walk = (node: unknown): void => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) { node.forEach(walk); return; }
        const record = node as Record<string, unknown>;
        if (record.search_model_queries !== undefined) collectQueries(record.search_model_queries);
        if (Array.isArray(record.search_result_groups)) {
            record.search_result_groups.forEach((g: unknown) => {
                if (!g || typeof g !== "object") return;
                const entries = (g as Record<string, unknown>).entries;
                if (Array.isArray(entries)) entries.forEach((e: unknown) => {
                    if (e && typeof e === "object") {
                        const r = e as Record<string, unknown>;
                        addSource(r.url, r.title, { snippet: str(r.snippet, 300) }, false);
                    }
                });
            });
        }
        if (Array.isArray(record.content_references)) {
            record.content_references.forEach((ref: unknown) => {
                if (ref && typeof ref === "object") {
                    const r = ref as Record<string, unknown>;
                    if (typeof r.url === "string") addSource(r.url, r.title, undefined, true);
                }
            });
        }
        if (Array.isArray(record.citations)) {
            record.citations.forEach((c: unknown) => {
                if (c && typeof c === "object") {
                    const r = c as Record<string, unknown>;
                    addSource(r.url, r.title, undefined, true);
                }
            });
        }
        for (const key of Object.keys(record)) {
            const value = record[key];
            const lk = key.toLowerCase();
            if (lk === "turn_use_case" && typeof value === "string" && value.trim() && !turnUseCase) turnUseCase = value.trim().slice(0, 60);
            else if ((lk === "model_slug" || lk === "model") && typeof value === "string" && value.trim() && !modelSlug && value.trim().length <= 60) modelSlug = value.trim();
            else if (lk === "working_turn_id" && typeof value === "string" && value.trim() && !workingTurnId) workingTurnId = value.trim().slice(0, 80);
            else if ((lk === "search_engine" || lk === "searchengine") && typeof value === "string" && value.trim() && !searchEngine) searchEngine = value.trim().slice(0, 80);
            if (value && typeof value === "object") walk(value);
        }
    };

    walk(root);
    if (queries.size === 0) return [];
    const all = Array.from(sources.values());
    all.sort((a, b) => Number(b.cited ?? false) - Number(a.cited ?? false));
    return Array.from(queries).map((q) => ({
        text: q,
        sources: all.length > 0 ? all : undefined,
        searchEngine,
        turnUseCase,
        modelSlug,
        workingTurnId,
    }));
}

/**
 * Backfill after refresh: GET the persistent conversation object and extract
 * fanout queries from its mapping nodes. Same-origin fetch inherits the page
 * session — no extra permissions needed. Returns null when unavailable.
 */
export async function backfillChatGPT(win: Window): Promise<{ results: BackfillResult[]; conversationId: string } | null> {
    const conversationId = getChatGPTConversationId(win);
    if (!conversationId) return null;
    try {
        const res = await win.fetch(`/backend-api/conversation/${conversationId}`, { credentials: "include" });
        if (!res.ok) return null;
        const text = await res.text();
        if (!text || text.length < 100) return null;
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch {
            return null;
        }
        const results = extractBackfillFromPayload(parsed);
        if (results.length === 0) return null;
        return { results, conversationId };
    } catch {
        return null;
    }
}
