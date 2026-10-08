import { regexFallback, SourceMap, type RegexRule } from "../core/extract";
import type { ExtractedQuery, IPlatformExtractor } from "./types";

const TOOL_USE_FALLBACK: RegexRule = {
    pattern: /"type"\s*:\s*"tool_use"[^}]*"name"\s*:\s*"web_search"[^}]*"input"\s*:\s*\{[^}]*"query"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
    extract: (m) => m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
};

export const ClaudeContext: IPlatformExtractor = {
    name: "Claude",

    shouldIntercept(url: string): boolean {
        return (
            (url.includes("/api/organizations/") && url.includes("/chat_conversations/")) ||
            url.includes("/completion")
        );
    },

    extract(text: string): ExtractedQuery[] | null {
        const queries = new Set<string>();
        const sources = new SourceMap();

        try {
            const data: unknown = JSON.parse(text);
            collectFromChatMessages(data, queries, sources);
            const completionQuery = (data as { completion?: { input?: { query?: unknown } } })?.completion?.input?.query;
            if (typeof completionQuery === "string" && completionQuery.trim()) queries.add(completionQuery);
        } catch {
            // Not a full JSON response, or a streaming fragment -- regex fallback below.
        }

        regexFallback(text, [TOOL_USE_FALLBACK]).forEach((q) => queries.add(q));

        if (queries.size === 0) return null;
        const sharedSources = sources.values();
        return Array.from(queries).map((q) => ({
            text: q,
            sources: sharedSources.length > 0 ? sharedSources : undefined,
        }));
    },
};

/**
 * Walks chat_messages[].content[] for a web_search tool_use block and its
 * result. Claude's web-search result shape on claude.ai's internal
 * chat_conversations endpoint isn't externally documented, so this checks
 * every plausible shape defensively (a web_search_tool_result block, a
 * generic tool_result block with a content array, and citations on a
 * rendered text block) -- closing a real gap where the original extractor
 * never populated sources for Claude at all. Intended to be validated and
 * corrected against real captured traffic (see the rebuild's live
 * verification pass).
 */
function collectFromChatMessages(data: unknown, queries: Set<string>, sources: SourceMap): void {
    if (!data || typeof data !== "object") return;
    const chatMessages = (data as Record<string, unknown>).chat_messages;
    if (!Array.isArray(chatMessages)) return;

    chatMessages.forEach((msg) => {
        if (!msg || typeof msg !== "object") return;
        const content = (msg as Record<string, unknown>).content;
        if (!Array.isArray(content)) return;

        content.forEach((block) => {
            if (!block || typeof block !== "object") return;
            const b = block as Record<string, unknown>;

            if (b.type === "tool_use" && b.name === "web_search") {
                const input = b.input as Record<string, unknown> | undefined;
                if (typeof input?.query === "string" && input.query.trim()) queries.add(input.query);
            }

            collectSearchResultBlock(b, sources);

            if (Array.isArray(b.citations)) {
                b.citations.forEach((c) => {
                    if (!c || typeof c !== "object") return;
                    const cite = c as Record<string, unknown>;
                    sources.add(typeof cite.url === "string" ? cite.url : undefined, {
                        title: typeof cite.title === "string" ? cite.title : undefined,
                    }, true);
                });
            }
        });
    });
}

function collectSearchResultBlock(block: Record<string, unknown>, sources: SourceMap): void {
    const type = typeof block.type === "string" ? block.type : "";
    const looksLikeSearchResult = type === "web_search_tool_result" || (type === "tool_result" && Array.isArray(block.content));
    if (!looksLikeSearchResult || !Array.isArray(block.content)) return;

    block.content.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const r = item as Record<string, unknown>;
        if (typeof r.url !== "string") return;
        sources.add(r.url, {
            title: typeof r.title === "string" ? r.title : undefined,
            pubDate: typeof r.page_age === "string" ? r.page_age : undefined,
        }, true);
    });
}
