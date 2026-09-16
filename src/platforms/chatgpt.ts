import { IPlatformExtractor, Source } from "./types";

/**
 * ChatGPT web traffic (chatgpt.com) streams assistant output over SSE via:
 *   - POST /backend-api/f/conversation            (current federated endpoint)
 *   - POST /backend-api/f/conversation/prepare    (conduit prewarm)
 *   - POST /backend-api/conversation              (legacy endpoint)
 *   - POST /backend-anon/f/conversation           (logged-out flow)
 *   -      /backend-api/lat/r                     (legacy telemetry-ish stream)
 *
 * NOTE: matching the bare substring "/backend-api/conversation" does NOT match
 * "/backend-api/f/conversation", which is why interception silently broke.
 */
export const ChatGPTContext: IPlatformExtractor = {
    name: "ChatGPT",
    shouldIntercept(url: string): boolean {
        if (!url) return false;
        const u = url.toLowerCase();
        // Covers absolute URLs, Request objects, and relative fetch paths
        // (e.g. fetch("/backend-api/f/conversation")).
        if (u.includes("/backend-api/") || u.includes("/backend-anon")) return true;
        const isChatGptHost = u.includes("chatgpt.com") || u.includes("chat.openai.com");
        return isChatGptHost && (u.includes("/conversation") || u.includes("/lat/r"));
    },
    extract(text: string): { text: string; sources?: Source[]; searchEngine?: string }[] | null {
        const queries = new Set<string>();
        const sources = new Map<string, Source>();
        const engineByQuery = new Map<string, Set<string>>();

        // Per-chunk collection context: a `search_engine` value only describes
        // the search steps in the same streamed object, so engines are tracked
        // per parsed chunk and never smeared across unrelated queries.
        interface CollectCtx {
            engines: Set<string>;
        }

        const addQuery = (q: unknown, ctx?: CollectCtx): void => {
            if (typeof q !== "string") return;
            const trimmed = q.trim();
            if (!trimmed) return;
            queries.add(trimmed);
            if (ctx && ctx.engines.size > 0) {
                let set = engineByQuery.get(trimmed);
                if (!set) {
                    set = new Set<string>();
                    engineByQuery.set(trimmed, set);
                }
                ctx.engines.forEach((e) => set!.add(e));
            }
        };

        const addEngine = (value: unknown, ctx: CollectCtx): void => {
            if (typeof value !== "string") return;
            const trimmed = value.trim();
            if (trimmed.length >= 2 && trimmed.length <= 80) ctx.engines.add(trimmed);
        };

        const addSource = (url: unknown, title?: unknown): void => {
            if (typeof url !== "string" || !url) return;
            if (sources.has(url)) return;
            let fallbackTitle = url;
            try {
                fallbackTitle = new URL(url).hostname;
            } catch {
                // Keep raw URL as title if it isn't parseable.
            }
            sources.set(url, {
                url,
                title: typeof title === "string" && title ? title : fallbackTitle,
            });
        };

        // Handles every observed shape of `search_model_queries`:
        //   ["a", "b"]  |  [{ query: "a" }]  |  { queries: [...] }  |  { queries: [{ query }] }
        const collectSearchModelQueries = (value: unknown, ctx: CollectCtx): void => {
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (typeof item === "string") addQuery(item, ctx);
                    else if (item && typeof item === "object") {
                        addQuery((item as Record<string, unknown>).query, ctx);
                        addQuery((item as Record<string, unknown>).search_query, ctx);
                        collectSearchModelQueries((item as Record<string, unknown>).queries, ctx);
                    }
                });
                return;
            }
            if (value && typeof value === "object") {
                const record = value as Record<string, unknown>;
                collectSearchModelQueries(record.queries, ctx);
                // Defensive: some payloads nest the array one level deeper.
                collectSearchModelQueries(record.search_queries, ctx);
            }
        };

        const collectToolCalls = (value: unknown, ctx: CollectCtx): void => {
            if (!Array.isArray(value)) return;
            value.forEach((tool: unknown) => {
                if (!tool || typeof tool !== "object") return;
                const record = tool as Record<string, unknown>;
                const name = typeof record.name === "string" ? record.name.toLowerCase() : "";
                // Current + legacy search tool namespaces: google_search, web_search,
                // browser.search, sonic_web_search, search, ...
                if (!name.includes("search")) return;
                const args = record.arguments ?? record.input;
                if (typeof args === "string") {
                    try {
                        const parsed = JSON.parse(args);
                        addQuery(parsed?.query, ctx);
                        addQuery(parsed?.search_query, ctx);
                    } catch {
                        // Arguments aren't JSON — nothing to extract.
                    }
                } else if (args && typeof args === "object") {
                    const argsRecord = args as Record<string, unknown>;
                    addQuery(argsRecord.query, ctx);
                    addQuery(argsRecord.search_query, ctx);
                }
            });
        };

        const collectSources = (node: Record<string, unknown>): void => {
            // Legacy: metadata.citations
            if (Array.isArray(node.citations)) {
                node.citations.forEach((c: unknown) => {
                    if (c && typeof c === "object") {
                        const citation = c as Record<string, unknown>;
                        addSource(citation.url, citation.title);
                    }
                });
            }
            // Current: search_result_groups[].entries[] ({ url, title, snippet })
            if (Array.isArray(node.search_result_groups)) {
                node.search_result_groups.forEach((group: unknown) => {
                    if (!group || typeof group !== "object") return;
                    const entries = (group as Record<string, unknown>).entries;
                    if (Array.isArray(entries)) {
                        entries.forEach((entry: unknown) => {
                            if (entry && typeof entry === "object") {
                                const record = entry as Record<string, unknown>;
                                addSource(record.url, record.title);
                            }
                        });
                    }
                });
            }
            // Current: content_references[] (grouped webpages + product carousels)
            if (Array.isArray(node.content_references)) {
                node.content_references.forEach((ref: unknown) => {
                    if (!ref || typeof ref !== "object") return;
                    const record = ref as Record<string, unknown>;
                    if (typeof record.url === "string") addSource(record.url, record.title);
                    if (Array.isArray(record.items)) {
                        record.items.forEach((item: unknown) => {
                            if (item && typeof item === "object") {
                                const itemRecord = item as Record<string, unknown>;
                                addSource(itemRecord.url, itemRecord.title);
                            }
                        });
                    }
                    if (Array.isArray(record.products)) {
                        record.products.forEach((p: unknown) => {
                            if (p && typeof p === "object") {
                                const product = p as Record<string, unknown>;
                                addSource(product.url, product.title);
                            }
                        });
                    }
                    if (record.product && typeof record.product === "object") {
                        const product = record.product as Record<string, unknown>;
                        addSource(product.url, product.title);
                    }
                });
            }
        };

        // Recursive walk over a parsed payload. Catches queries/sources wherever
        // OpenAI nests them (message.metadata, message.content.parts, top-level, ...).
        // NOTE: engines are pre-collected per chunk (see call sites) because a
        // `search_engine` tag can appear after the queries it describes.
        const searchNode = (node: unknown, ctx: CollectCtx): void => {
            if (!node || typeof node !== "object") return;
            if (Array.isArray(node)) {
                node.forEach((item) => searchNode(item, ctx));
                return;
            }
            const record = node as Record<string, unknown>;

            if (record.search_model_queries !== undefined) {
                collectSearchModelQueries(record.search_model_queries, ctx);
            }
            if (record.tool_calls !== undefined) collectToolCalls(record.tool_calls, ctx);
            if (record.tool_uses !== undefined) collectToolCalls(record.tool_uses, ctx);
            collectSources(record);

            for (const key of Object.keys(record)) {
                const value = record[key];
                const lowerKey = key.toLowerCase();
                // Search-backend tag (e.g. "serpapi", "labrador-news-7d", "bing-image").
                if (lowerKey === "search_engine" || lowerKey === "searchengine") {
                    addEngine(value, ctx);
                }
                // Generic query-ish string fields (query, search_query, searchQuery, ...).
                // NOTE: the real ChatGPT key is "search_model_queries" (plural "queries",
                // which does NOT contain the substring "query"), so match both spellings.
                else if (
                    (lowerKey === "query" ||
                        lowerKey === "search_query" ||
                        lowerKey === "searchquery" ||
                        lowerKey === "search_queries" ||
                        lowerKey === "web_search_query") &&
                    typeof value === "string" &&
                    value.trim().length >= 3 &&
                    value.trim().length < 500
                ) {
                    addQuery(value, ctx);
                } else if (value && typeof value === "object") {
                    searchNode(value, ctx);
                }
            }
        };

        // Engine pre-pass: sweep a parsed chunk for `search_engine` tags BEFORE
        // extracting queries, so attribution doesn't depend on key order.
        const collectEngines = (node: unknown, ctx: CollectCtx): void => {
            if (!node || typeof node !== "object") return;
            if (Array.isArray(node)) {
                node.forEach((item) => collectEngines(item, ctx));
                return;
            }
            const record = node as Record<string, unknown>;
            for (const key of Object.keys(record)) {
                const value = record[key];
                const lowerKey = key.toLowerCase();
                if (lowerKey === "search_engine" || lowerKey === "searchengine") {
                    addEngine(value, ctx);
                } else if (value && typeof value === "object") {
                    collectEngines(value, ctx);
                }
            }
        };

        const lines = text.split("\n");

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("data: ")) {
                const content = trimmedLine.slice(6).trim();
                if (!content || content === "[DONE]") continue;
                try {
                    const parsed: unknown = JSON.parse(content);
                    const ctx: CollectCtx = { engines: new Set<string>() };
                    collectEngines(parsed, ctx);
                    searchNode(parsed, ctx);
                } catch {
                    // Ignore parse errors for partial chunks.
                }
            } else if (trimmedLine.length > 20 && trimmedLine.startsWith("{")) {
                // Non-SSE fallback (e.g. initialization JSON or buffered responses).
                try {
                    const parsed: unknown = JSON.parse(trimmedLine);
                    const ctx: CollectCtx = { engines: new Set<string>() };
                    collectEngines(parsed, ctx);
                    searchNode(parsed, ctx);
                } catch {
                    // Ignore parse errors for partial chunks.
                }
            }
        }

        // --- REGEX FALLBACKS (for truncated/partial chunks that don't parse) ---
        if (queries.size === 0 && text.includes("search_model_queries")) {
            // Object shape: "search_model_queries": { ... "queries": [...] }
            const objectRegex = /"search_model_queries"\s*:\s*\{[^}]*?"queries"\s*:\s*(\[[^\]]+\])/;
            const objectMatch = text.match(objectRegex);
            if (objectMatch?.[1]) {
                try {
                    const parsed: unknown = JSON.parse(objectMatch[1]);
                    collectSearchModelQueries(parsed, { engines: new Set<string>() });
                } catch {
                    // Ignore malformed fragments.
                }
            }
            // Flat-array shape: "search_model_queries": [...]
            if (queries.size === 0) {
                const arrayRegex = /"search_model_queries"\s*:\s*(\[[^\]]+\])/;
                const arrayMatch = text.match(arrayRegex);
                if (arrayMatch?.[1]) {
                    try {
                        const parsed: unknown = JSON.parse(arrayMatch[1]);
                        collectSearchModelQueries(parsed, { engines: new Set<string>() });
                    } catch {
                        // Ignore malformed fragments.
                    }
                }
            }
        }

        // Generic search-tool-call fallback regex (any *search* tool name).
        if (queries.size === 0 && text.toLowerCase().includes("search")) {
            const toolRegex = /"name"\s*:\s*"[^"]*search[^"]*"[^}]*?"(?:arguments|input)"\s*:\s*("(?:[^"\\]|\\.)*"|\{.*?\})/gi;
            let m: RegExpExecArray | null;
            const fallbackCtx: CollectCtx = { engines: new Set<string>() };
            while ((m = toolRegex.exec(text)) !== null) {
                const raw = m[1];
                try {
                    if (raw.startsWith('"')) {
                        const args = JSON.parse(JSON.parse(raw) as string);
                        addQuery(args?.query, fallbackCtx);
                        addQuery(args?.search_query, fallbackCtx);
                    } else {
                        const args = JSON.parse(raw);
                        addQuery(args?.query, fallbackCtx);
                        addQuery(args?.search_query, fallbackCtx);
                    }
                } catch {
                    // Ignore malformed fragments.
                }
            }
        }

        // Engine fallback for unparseable chunks: if queries were recovered via
        // regex but their chunk didn't parse, attribute the engine only when the
        // whole response names exactly one — and only when structured parsing
        // found no engines at all, so engines never leak onto unrelated queries.
        const engineLess = Array.from(queries).filter((q) => !engineByQuery.get(q)?.size);
        if (engineLess.length > 0 && engineByQuery.size === 0) {
            const found = new Set<string>();
            const engineRegex = /"search_?engine"\s*:\s*"([^"\\]+)"/gi;
            let m: RegExpExecArray | null;
            while ((m = engineRegex.exec(text)) !== null) {
                const name = m[1].trim();
                if (name) found.add(name);
            }
            if (found.size === 1) {
                const [only] = Array.from(found);
                engineLess.forEach((q) => engineByQuery.set(q, new Set([only])));
            }
        }

        const uniqueSources = Array.from(sources.values());
        return queries.size > 0
            ? Array.from(queries).map((q) => {
                  const engines = engineByQuery.get(q);
                  const engineList = engines ? Array.from(new Set(engines)) : [];
                  return {
                      text: q,
                      sources: uniqueSources.length > 0 ? uniqueSources : undefined,
                      searchEngine:
                          engineList.length > 0 ? engineList.join(", ") : undefined,
                  };
              })
            : null;
    },
};
