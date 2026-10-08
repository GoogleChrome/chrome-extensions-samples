import { frameSse, QueryRegistry, SourceMap, walkJson, type ChunkMeta } from "../core/extract";
import type { ExtractedQuery, IPlatformExtractor } from "./types";

/**
 * ChatGPT web traffic (chatgpt.com) streams assistant output over SSE via:
 *   - POST /backend-api/f/conversation            (current federated endpoint)
 *   - POST /backend-api/f/conversation/prepare    (conduit prewarm)
 *   - POST /backend-api/conversation              (legacy endpoint)
 *   - POST /backend-anon/f/conversation           (logged-out flow)
 *   -      /backend-api/lat/r                     (legacy telemetry-ish stream)
 *
 * NOTE: matching the bare substring "/backend-api/conversation" does NOT match
 * "/backend-api/f/conversation", which is why interception silently broke before.
 */
export const ChatGPTContext: IPlatformExtractor = {
    name: "ChatGPT",

    shouldIntercept(url: string): boolean {
        if (!url) return false;
        const u = url.toLowerCase();
        if (u.includes("/backend-api/") || u.includes("/backend-anon")) return true;
        const isChatGptHost = u.includes("chatgpt.com") || u.includes("chat.openai.com");
        return isChatGptHost && (u.includes("/conversation") || u.includes("/lat/r"));
    },

    extract(text: string): ExtractedQuery[] | null {
        const registry = new QueryRegistry();
        const sources = new SourceMap();

        for (const frame of frameSse(text)) {
            if (frame.json === undefined) continue;
            const meta = collectChunkMeta(frame.json);
            collectQueriesAndSources(frame.json, (q) => registry.add(q, meta), sources);
        }

        if (registry.queryCount === 0) {
            runRegexFallbacks(text, registry);
        }
        if (registry.queryCount === 0) return null;

        applyLoneValueFallbacks(text, registry);

        registry.setSources(sources.values());
        return registry.toExtractedQueries();
    },
};

const textOf = (v: unknown, max = 300): string | undefined => {
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    if (!t) return undefined;
    return t.length > max ? t.slice(0, max) : t;
};

// --- Query collection -------------------------------------------------

/** Handles every observed shape: ["a","b"] | [{query:"a"}] | {queries:[...]} | {queries:[{query}]}. */
function collectSearchModelQueries(value: unknown, onQuery: (q: string) => void): void {
    if (Array.isArray(value)) {
        value.forEach((item) => {
            if (typeof item === "string") {
                if (item.trim()) onQuery(item);
            } else if (item && typeof item === "object") {
                const rec = item as Record<string, unknown>;
                if (typeof rec.query === "string" && rec.query.trim()) onQuery(rec.query);
                if (typeof rec.search_query === "string" && rec.search_query.trim()) onQuery(rec.search_query);
                collectSearchModelQueries(rec.queries, onQuery);
            }
        });
        return;
    }
    if (value && typeof value === "object") {
        const rec = value as Record<string, unknown>;
        collectSearchModelQueries(rec.queries, onQuery);
        collectSearchModelQueries(rec.search_queries, onQuery); // defensive: some payloads nest one level deeper
    }
}

/** Current + legacy search tool namespaces: google_search, web_search, browser.search, sonic_web_search, search, ... */
function collectToolCalls(value: unknown, onQuery: (q: string) => void): void {
    if (!Array.isArray(value)) return;
    value.forEach((tool) => {
        if (!tool || typeof tool !== "object") return;
        const rec = tool as Record<string, unknown>;
        const name = typeof rec.name === "string" ? rec.name.toLowerCase() : "";
        if (!name.includes("search")) return;

        const args = rec.arguments ?? rec.input;
        if (typeof args === "string") {
            try {
                const parsed = JSON.parse(args) as Record<string, unknown>;
                if (typeof parsed?.query === "string" && parsed.query.trim()) onQuery(parsed.query);
                if (typeof parsed?.search_query === "string" && parsed.search_query.trim()) onQuery(parsed.search_query);
            } catch {
                // Arguments aren't JSON -- nothing to extract.
            }
        } else if (args && typeof args === "object") {
            const a = args as Record<string, unknown>;
            if (typeof a.query === "string" && a.query.trim()) onQuery(a.query);
            if (typeof a.search_query === "string" && a.search_query.trim()) onQuery(a.search_query);
        }
    });
}

// --- Source collection --------------------------------------------------

function collectSources(node: Record<string, unknown>, sources: SourceMap): void {
    // Legacy: metadata.citations (these ARE cited by definition).
    if (Array.isArray(node.citations)) {
        node.citations.forEach((c) => {
            if (!c || typeof c !== "object") return;
            const r = c as Record<string, unknown>;
            sources.add(typeof r.url === "string" ? r.url : undefined, {
                title: typeof r.title === "string" ? r.title : undefined,
                snippet: textOf(r.snippet ?? r.text, 300),
                attribution: textOf(r.attribution, 120),
                pubDate: textOf(r.pub_date ?? r.pubDate, 40),
                resultSource: textOf(r.result_source ?? r.resultSource, 60),
            }, true);
        });
    }
    // Current: search_result_groups[].entries[] -- retrieved pool.
    if (Array.isArray(node.search_result_groups)) {
        node.search_result_groups.forEach((group) => {
            if (!group || typeof group !== "object") return;
            const entries = (group as Record<string, unknown>).entries;
            if (!Array.isArray(entries)) return;
            entries.forEach((entry) => {
                if (!entry || typeof entry !== "object") return;
                const r = entry as Record<string, unknown>;
                sources.add(typeof r.url === "string" ? r.url : undefined, {
                    title: typeof r.title === "string" ? r.title : undefined,
                    snippet: textOf(r.snippet, 300),
                    attribution: textOf(r.attribution, 120),
                    pubDate: textOf(r.pub_date ?? r.pubDate, 40),
                    resultSource: textOf(r.result_source ?? r.resultSource, 60),
                }, false);
            });
        });
    }
    // Current: content_references[] (grouped webpages + product carousels) -- cited pool.
    if (Array.isArray(node.content_references)) {
        node.content_references.forEach((ref) => {
            if (!ref || typeof ref !== "object") return;
            const r = ref as Record<string, unknown>;
            if (typeof r.url === "string") {
                sources.add(r.url, {
                    title: typeof r.title === "string" ? r.title : undefined,
                    snippet: textOf(r.snippet, 300),
                    attribution: textOf(r.attribution, 120),
                }, true);
            }
            if (Array.isArray(r.items)) {
                r.items.forEach((item) => {
                    if (!item || typeof item !== "object") return;
                    const ir = item as Record<string, unknown>;
                    sources.add(typeof ir.url === "string" ? ir.url : undefined, {
                        title: typeof ir.title === "string" ? ir.title : undefined,
                        snippet: textOf(ir.snippet, 300),
                    }, true);
                });
            }
            if (Array.isArray(r.products)) {
                r.products.forEach((p) => {
                    if (!p || typeof p !== "object") return;
                    const pr = p as Record<string, unknown>;
                    sources.add(typeof pr.url === "string" ? pr.url : undefined, {
                        title: typeof pr.title === "string" ? pr.title : undefined,
                    }, true);
                });
            }
            if (r.product && typeof r.product === "object") {
                const pr = r.product as Record<string, unknown>;
                sources.add(typeof pr.url === "string" ? pr.url : undefined, {
                    title: typeof pr.title === "string" ? pr.title : undefined,
                }, true);
            }
        });
    }
}

// --- Per-chunk metadata (search_engine / turn_use_case / model_slug / working_turn_id) ---

function collectChunkMeta(json: unknown): ChunkMeta {
    const meta: ChunkMeta = { engines: new Set<string>() };
    walkJson(json, (node, path) => {
        const key = path[path.length - 1];
        if (typeof key !== "string" || typeof node !== "string") return;
        const value = node.trim();
        if (!value) return;

        const lowerKey = key.toLowerCase();
        if (lowerKey === "search_engine" || lowerKey === "searchengine") {
            if (value.length >= 2 && value.length <= 80) meta.engines!.add(value);
        } else if ((lowerKey === "turn_use_case" || lowerKey === "turnusecase") && !meta.turnUseCase) {
            meta.turnUseCase = value.slice(0, 60);
        } else if ((lowerKey === "model_slug" || lowerKey === "modelslug" || lowerKey === "model") && !meta.modelSlug && value.length <= 60) {
            meta.modelSlug = value;
        } else if ((lowerKey === "working_turn_id" || lowerKey === "workingturnid") && !meta.workingTurnId) {
            meta.workingTurnId = value.slice(0, 80);
        }
    });
    return meta;
}

// --- Structural walk: queries, tool calls, and sources for one parsed chunk ---

function collectQueriesAndSources(json: unknown, onQuery: (q: string) => void, sources: SourceMap): void {
    walkJson(json, (node, path) => {
        if (node && typeof node === "object" && !Array.isArray(node)) {
            const rec = node as Record<string, unknown>;
            if (rec.search_model_queries !== undefined) collectSearchModelQueries(rec.search_model_queries, onQuery);
            if (rec.tool_calls !== undefined) collectToolCalls(rec.tool_calls, onQuery);
            if (rec.tool_uses !== undefined) collectToolCalls(rec.tool_uses, onQuery);
            collectSources(rec, sources);
        }

        // Generic query-ish string fields. NOTE: the real ChatGPT key is
        // "search_model_queries" (plural "queries", which does NOT contain the
        // substring "query"), so this never double-matches it.
        const key = path[path.length - 1];
        if (
            typeof key === "string" &&
            typeof node === "string" &&
            (key.toLowerCase() === "query" ||
                key.toLowerCase() === "search_query" ||
                key.toLowerCase() === "searchquery" ||
                key.toLowerCase() === "search_queries" ||
                key.toLowerCase() === "web_search_query") &&
            node.trim().length >= 3 &&
            node.trim().length < 500
        ) {
            onQuery(node);
        }
    });
}

// --- Regex fallbacks for chunks that failed to JSON.parse (truncated streaming fragments) ---

function runRegexFallbacks(text: string, registry: QueryRegistry): void {
    if (text.includes("search_model_queries")) {
        const objectRegex = /"search_model_queries"\s*:\s*\{[^}]*?"queries"\s*:\s*(\[[^\]]+\])/;
        const objectMatch = text.match(objectRegex);
        if (objectMatch?.[1]) {
            try {
                collectSearchModelQueries(JSON.parse(objectMatch[1]), (q) => registry.add(q));
            } catch {
                // Malformed fragment -- nothing to recover.
            }
        }
        if (registry.queryCount === 0) {
            const arrayRegex = /"search_model_queries"\s*:\s*(\[[^\]]+\])/;
            const arrayMatch = text.match(arrayRegex);
            if (arrayMatch?.[1]) {
                try {
                    collectSearchModelQueries(JSON.parse(arrayMatch[1]), (q) => registry.add(q));
                } catch {
                    // Malformed fragment -- nothing to recover.
                }
            }
        }
    }

    if (registry.queryCount === 0 && text.toLowerCase().includes("search")) {
        const toolRegex = /"name"\s*:\s*"[^"]*search[^"]*"[^}]*?"(?:arguments|input)"\s*:\s*("(?:[^"\\]|\\.)*"|\{.*?\})/gi;
        let m: RegExpExecArray | null;
        while ((m = toolRegex.exec(text)) !== null) {
            const raw = m[1];
            try {
                const args = raw.startsWith('"') ? JSON.parse(JSON.parse(raw) as string) : JSON.parse(raw);
                if (typeof args?.query === "string" && args.query.trim()) registry.add(args.query);
                if (typeof args?.search_query === "string" && args.search_query.trim()) registry.add(args.search_query);
            } catch {
                // Malformed fragment -- nothing to recover.
            }
        }
    }
}

// --- Last-resort attribution for regex-recovered queries: apply a single,
// globally-unambiguous value only when the whole response names exactly one
// (never guess between multiple candidates, never overwrite a value a query
// already has from structured parsing). ---

function applyLoneValueFallbacks(text: string, registry: QueryRegistry): void {
    const queries = registry.toExtractedQueries();

    const engineless = queries.filter((q) => !q.searchEngine);
    const anyStructuredEngine = queries.some((q) => q.searchEngine);
    if (engineless.length > 0 && !anyStructuredEngine) {
        const found = findLoneRegexValue(text, /"search_?engine"\s*:\s*"([^"\\]+)"/gi);
        if (found) engineless.forEach((q) => registry.add(q.text, { engines: new Set([found]) }));
    }

    applyLoneFieldFallback(text, registry, queries, "turnUseCase", /"turn_use_case"\s*:\s*"([^"\\]+)"/gi,
        (value) => ({ turnUseCase: value }));
    applyLoneFieldFallback(text, registry, queries, "modelSlug", /"model_slug"\s*:\s*"([^"\\]+)"/gi,
        (value) => ({ modelSlug: value }));
    applyLoneFieldFallback(text, registry, queries, "workingTurnId", /"working_turn_id"\s*:\s*"([^"\\]+)"/gi,
        (value) => ({ workingTurnId: value }));
}

function applyLoneFieldFallback(
    text: string,
    registry: QueryRegistry,
    queries: ExtractedQuery[],
    field: "turnUseCase" | "modelSlug" | "workingTurnId",
    pattern: RegExp,
    toMeta: (value: string) => ChunkMeta,
): void {
    if (queries.some((q) => q[field])) return; // already set via structured parsing -- never guess.
    const found = findLoneRegexValue(text, pattern, 60);
    if (!found) return;
    const meta = toMeta(found);
    queries.forEach((q) => {
        if (!q[field]) registry.add(q.text, meta);
    });
}

/** Returns the single value found via `pattern`, or undefined if zero or more than one distinct value exists. */
function findLoneRegexValue(text: string, pattern: RegExp, maxLength = Infinity): string | undefined {
    const found = new Set<string>();
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
        const value = (m[1] || "").trim();
        if (value && value.length <= maxLength) found.add(value);
    }
    return found.size === 1 ? [...found][0] : undefined;
}
