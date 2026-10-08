import { frameBatchExecute, pathContains, pathEndsWith, SourceMap, walkJson, type PathSegment } from "../core/extract";
import type { ExtractedQuery, IPlatformExtractor } from "./types";

export const GeminiContext: IPlatformExtractor = {
    name: "Gemini",

    shouldIntercept(url: string): boolean {
        const isGeminiDomain =
            url.includes("gemini.google.com") ||
            url.includes("generativelanguage.googleapis.com") ||
            url.includes("googleapis.com") ||
            url.includes("gstatic.com") ||
            // Support relative URLs when on the Gemini page.
            (window.location.hostname.includes("gemini.google") && url.startsWith("/"));

        return (
            isGeminiDomain &&
            (url.includes("/api/") ||
                url.includes("/v1/") ||
                url.includes("/generate") ||
                url.includes("/stream") ||
                url.includes("/chat") ||
                url.includes("/search") ||
                url.includes("/models/") ||
                url.includes("generateContent") ||
                url.includes("streamGenerateContent") ||
                url.includes("/_/BardChatUi/data/batchexecute"))
        );
    },

    extract(text: string): ExtractedQuery[] | null {
        const queries = new Set<string>();
        const sources = new SourceMap();

        for (const frame of frameBatchExecute(text)) {
            if (frame.json !== undefined) collectFromNode(frame.json, queries, sources);
        }

        if (queries.size === 0) {
            runRegexFallback(text, queries);
        }

        if (queries.size === 0) return null;
        const sharedSources = sources.values();
        return Array.from(queries).map((q) => ({
            text: q,
            sources: sharedSources.length > 0 ? sharedSources : undefined,
        }));
    },
};

/**
 * Single canonical heuristic deciding whether an arbitrary string "looks
 * like" a search query -- used both for Gemini's batchexecute array-of-
 * strings structure and its regex fallback. The original had two near-
 * identical copies of this scoring logic (one per call site) that had
 * drifted apart; this uses the richer of the two (more exclusion checks,
 * wider length/word bounds) for both, per the rebuild's "one function, not
 * two near-copies" direction. Gemini's extraction is inherently the least
 * reliable of the four platforms (undocumented wire format, heuristic-based)
 * -- validate/tune this against real captured traffic.
 */
function looksLikeSearchQuery(trimmed: string): boolean {
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
    return (
        trimmed.length >= 10 &&
        trimmed.length <= 150 &&
        words.length >= 3 &&
        words.length <= 15 &&
        !trimmed.includes("http") &&
        !trimmed.includes("@") &&
        !/^rc?_[a-f0-9]/i.test(trimmed) &&
        !/^c_[a-f0-9]+/i.test(trimmed) &&
        !/^r_[a-f0-9]+/i.test(trimmed) &&
        !trimmed.includes("**") &&
        !trimmed.includes("*") &&
        !trimmed.startsWith("#") &&
        !trimmed.endsWith(".") &&
        !trimmed.endsWith(":") &&
        !trimmed.endsWith("!") &&
        !trimmed.endsWith("?") &&
        !/^(What|Why|How|Is|Are|Who|Where|When|Does|Which|Can|Will|Should|Would|Could|May)\s/i.test(trimmed) &&
        !/^(The|Here|Following|After|Current|Today|This|That|These|Those|A|An|I|You|We|They)\s/i.test(trimmed) &&
        !(words.length <= 3 && trimmed === trimmed.replace(/\b\w/g, (l) => l.toUpperCase())) &&
        !(trimmed === trimmed.toUpperCase() && trimmed.length < 30) &&
        !/^\d+\.\s/.test(trimmed) &&
        !trimmed.startsWith("* ") &&
        !trimmed.startsWith("- ") &&
        !/^[a-f0-9]{32}$/i.test(trimmed) &&
        !trimmed.startsWith("SWML_") &&
        !trimmed.includes("\\u003d") &&
        /\b(latest|news|update|search|find|information|about|regarding|related to|status|report|case|issue|policy|ban|law|legal|government|mall|pet|Malaysia|December|2025|investigation|challenge|today)\b/i.test(
            trimmed
        )
    );
}

const QUERY_KEYS = new Set([
    "query",
    "search_query",
    "searchQuery",
    "search_queries",
    "searchQueryText",
    "queryText",
    // Deliberately excludes the generic "text" key: confirmed live (2026-10-08)
    // to false-positive on ordinary response prose -- any chunk shaped like
    // `{text: "...a fragment of the assistant's own answer..."}` (extremely
    // common in any chat response) was being captured as a "search query".
]);

/** Keys whose value is an array of query strings (Gemini's public grounding
 * API exposes search queries this way -- groundingMetadata.webSearchQueries
 * -- the consumer product's internal batchexecute schema plausibly mirrors
 * this concept even if not the exact field name; kept as a short, named list
 * rather than a blind guess so it's easy to extend once confirmed against
 * real traffic). */
const QUERY_ARRAY_KEYS = new Set(["webSearchQueries", "searchQueries", "search_queries", "queries"]);

/** Recursive structural walk over one parsed batchexecute part. */
function collectFromNode(root: unknown, queries: Set<string>, sources: SourceMap): void {
    const visit = (node: unknown, path: readonly PathSegment[]): void | "skip" => {
        // Skip known noise: titles live at [...][2][X][1] -- never search queries,
        // and nothing under them is either.
        if (pathContains(path, [2, null, 1])) return "skip";

        const key = path[path.length - 1];

        // Gemini batchexecute nests a JSON-encoded string at index 2 of many arrays.
        if (key === 2 && typeof node === "string" && node.length > 10) {
            const trimmed = node.trim();
            if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
                try {
                    const parsed = JSON.parse(node);
                    walkJson(parsed, visit, [...path, "(parsed)"]);
                } catch {
                    // Not actually nested JSON -- ignore.
                }
            }
        }

        // Search queries live as index-0 strings under a parent path ending [0][0][3][1][X].
        if (typeof node === "string" && pathEndsWith(path, [0, 0, 3, 1, null, 0])) {
            const trimmed = node.trim();
            if (looksLikeSearchQuery(trimmed)) queries.add(trimmed);
        }

        // Generic named query fields, wherever they appear.
        if (typeof key === "string" && typeof node === "string" && QUERY_KEYS.has(key) && node.length > 5 && node.length < 500) {
            queries.add(node);
        }

        // Same, but for the array-of-strings shape (e.g. webSearchQueries).
        if (typeof key === "string" && Array.isArray(node) && QUERY_ARRAY_KEYS.has(key)) {
            node.forEach((item) => {
                if (typeof item === "string") {
                    const trimmed = item.trim();
                    if (trimmed.length > 3 && trimmed.length < 500) queries.add(trimmed);
                }
            });
        }

        if (node && typeof node === "object" && !Array.isArray(node)) {
            const record = node as Record<string, unknown>;

            if (key === "functionCall") {
                const fn = record as { name?: string; args?: { query?: string } };
                if ((fn.name === "search" || fn.name === "web_search") && fn.args?.query) {
                    queries.add(fn.args.query);
                }
            }

            if (Array.isArray(record.citations)) {
                record.citations.forEach((c) => addCitation(c, sources));
            }
            const grounding = record.groundingMetadata as { citations?: unknown } | undefined;
            if (Array.isArray(grounding?.citations)) {
                grounding.citations.forEach((c) => addCitation(c, sources));
            }
        }

        return undefined;
    };

    walkJson(root, visit);
}

function addCitation(c: unknown, sources: SourceMap): void {
    if (!c || typeof c !== "object") return;
    const cite = c as Record<string, unknown>;
    if (typeof cite.url === "string") {
        sources.add(cite.url, { title: typeof cite.title === "string" ? cite.title : undefined });
    }
}

function runRegexFallback(text: string, queries: Set<string>): void {
    const keyPatterns = [
        /"query"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
        /"search_query"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
        /"searchQuery"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
    ];
    for (const pattern of keyPatterns) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(text)) !== null) {
            const q = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
            if (q.length > 10 && q.length < 150 && !q.includes("http")) queries.add(q);
        }
    }

    // Last resort: any quoted term in the raw response that passes the same
    // query-shape heuristic used for the structural array path.
    const quotedTermPattern = /(?:^|[^\\])["']([a-zA-Z][a-zA-Z0-9\s]{2,40}?)(?:["']|\\["'])/g;
    let m: RegExpExecArray | null;
    while ((m = quotedTermPattern.exec(text)) !== null) {
        const term = m[1].trim();
        if (looksLikeSearchQuery(term)) queries.add(term);
    }
}
