import { frameSse, regexFallback, rejectNearKeywords, SourceMap, walkJson, type RegexRule } from "../core/extract";
import type { ExtractedQuery, IPlatformExtractor } from "./types";

/** Excluded entirely -- not just from the generic key check, but from descent, so
 * nothing under these keys (not even a nested search_queries/citations container)
 * is ever considered. Matches the original's `continue` in its own key loop. */
const SKIP_KEYS = new Set(["related_queries", "suggested_queries"]);

const FALLBACK_RULES: RegexRule[] = [
    {
        pattern: /"search_query"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
        extract: (m) => m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
        reject: rejectNearKeywords([...SKIP_KEYS], 50),
    },
    {
        pattern: /"query"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
        extract: (m) => m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
        reject: rejectNearKeywords([...SKIP_KEYS], 50),
    },
];

export const PerplexityContext: IPlatformExtractor = {
    name: "Perplexity",

    shouldIntercept(url: string): boolean {
        return (
            url.includes("perplexity.ai") &&
            (url.includes("/rest/sse/perplexity_ask") ||
                (url.includes("/rest/thread/") && url.includes("with_schematized_response=true")))
        );
    },

    extract(text: string): ExtractedQuery[] | null {
        const queries = new Set<string>();
        const sources = new SourceMap();

        for (const frame of frameSse(text)) {
            if (frame.json !== undefined) collectFromChunk(frame.json, queries, sources);
        }

        // Unlike ChatGPT's fallback, this always runs -- even when the structured
        // walk already found queries -- matching the original's unconditional
        // regex pass (its own comment: "From Legacy").
        regexFallback(text, FALLBACK_RULES).forEach((q) => {
            if (q.length > 3 && q.length < 500) queries.add(q);
        });

        if (queries.size === 0) return null;
        const sharedSources = sources.values();
        return Array.from(queries).map((q) => ({
            text: q,
            sources: sharedSources.length > 0 ? sharedSources : undefined,
        }));
    },
};

function addSource(sources: SourceMap, url: unknown, title?: unknown, name?: unknown): void {
    if (typeof url !== "string") return;
    const resolvedTitle = typeof title === "string" ? title : typeof name === "string" ? name : undefined;
    sources.add(url, { title: resolvedTitle });
}

function collectFromChunk(json: unknown, queries: Set<string>, sources: SourceMap): void {
    walkJson(json, (node, path) => {
        const key = path[path.length - 1];
        if (typeof key === "string" && SKIP_KEYS.has(key)) return "skip";

        if (node && typeof node === "object" && !Array.isArray(node)) {
            const rec = node as Record<string, unknown>;

            if (Array.isArray(rec.search_queries)) {
                rec.search_queries.forEach((q) => {
                    if (typeof q === "string" && q.trim()) queries.add(q);
                    else if (q && typeof q === "object" && typeof (q as Record<string, unknown>).query === "string") {
                        queries.add((q as Record<string, unknown>).query as string);
                    }
                });
            }

            if (Array.isArray(rec.citations)) {
                rec.citations.forEach((c) => {
                    if (!c || typeof c !== "object") return;
                    const cite = c as Record<string, unknown>;
                    if (typeof cite.query === "string" && cite.query.trim()) queries.add(cite.query);
                    if (typeof cite.search_query === "string" && cite.search_query.trim()) queries.add(cite.search_query);
                    addSource(sources, cite.url, cite.title);
                });
            }

            // "results"/"web_results" sometimes carry source info directly.
            if (Array.isArray(rec.results)) {
                rec.results.forEach((r) => {
                    if (r && typeof r === "object") {
                        const result = r as Record<string, unknown>;
                        addSource(sources, result.url, result.title, result.name);
                    }
                });
            }

            if (Array.isArray(rec.steps)) {
                rec.steps.forEach((s) => {
                    if (!s || typeof s !== "object") return;
                    const step = s as Record<string, unknown>;
                    if (step.type === "search" || step.step_type === "SEARCH_WEB") {
                        const q = typeof step.query === "string" ? step.query : step.search_query;
                        if (typeof q === "string" && q.trim()) queries.add(q);
                    }
                    if (Array.isArray(step.results)) {
                        step.results.forEach((r) => {
                            if (r && typeof r === "object") {
                                const result = r as Record<string, unknown>;
                                addSource(sources, result.url, result.title, result.name);
                            }
                        });
                    }
                });
            }
        }

        // Generic fallthrough: a bare "query"/"search_query" string leaf.
        if (
            typeof key === "string" &&
            typeof node === "string" &&
            (key === "query" || key === "search_query") &&
            node.trim()
        ) {
            queries.add(node);
        }
        return undefined;
    });
}
