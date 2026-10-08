import { IPlatformExtractor } from "./types";

export const PerplexityContext: IPlatformExtractor = {
    name: "Perplexity",
    shouldIntercept(url: string): boolean {
        return (
            url.includes("perplexity.ai") &&
            (url.includes("/rest/sse/perplexity_ask") ||
                (url.includes("/rest/thread/") &&
                    url.includes("with_schematized_response=true")))
        );
    },
    extract(text: string): { text: string; sources?: import("./types").Source[] }[] | null {
        const queries = new Set<string>();
        const sources = new Map<string, import("./types").Source>();

        const lines = text.split("\n");

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("data: ") || (trimmedLine.startsWith("{") && trimmedLine.endsWith("}"))) {
                try {
                    const content = trimmedLine.startsWith("data: ") ? trimmedLine.slice(6).trim() : trimmedLine;
                    if (content === "[DONE]" || !content) continue;

                    const data = JSON.parse(content);

                    const searchDeep = (obj: any): void => {
                        if (!obj || typeof obj !== "object") return;

                        // Priority patterns
                        if (Array.isArray(obj.search_queries)) {
                            obj.search_queries.forEach((q: any) => {
                                if (typeof q === 'string') queries.add(q);
                                else if (q.query) queries.add(q.query);
                            });
                        }

                        if (Array.isArray(obj.citations)) {
                            obj.citations.forEach((c: any) => {
                                if (c.query) queries.add(c.query);
                                if (c.search_query) queries.add(c.search_query);

                                // Capture URL and Title
                                if (c.url) {
                                    sources.set(c.url, { url: c.url, title: c.title || new URL(c.url).hostname });
                                }
                            });
                        }

                        // Also check for "results" or "web_results" which sometimes contain source info
                        if (Array.isArray(obj.results)) {
                            obj.results.forEach((r: any) => {
                                if (r.url) sources.set(r.url, { url: r.url, title: r.title || r.name });
                            });
                        }

                        if (Array.isArray(obj.steps)) {
                            obj.steps.forEach((s: any) => {
                                if ((s.type === "search" || s.step_type === "SEARCH_WEB") && (s.query || s.search_query)) {
                                    queries.add(s.query || s.search_query);
                                }
                                // Steps might contain results too
                                if (Array.isArray(s.results)) {
                                    s.results.forEach((r: any) => {
                                        if (r.url) sources.set(r.url, { url: r.url, title: r.title || r.name });
                                    });
                                }
                            });
                        }

                        // Recursive search
                        for (const key in obj) {
                            if (key === "related_queries" || key === "suggested_queries") continue;
                            const val = obj[key];
                            if ((key === "query" || key === "search_query") && typeof val === "string") {
                                queries.add(val);
                            } else if (typeof val === "object") {
                                searchDeep(val);
                            }
                        }
                    };

                    searchDeep(data);
                } catch (e) { }
            }
        }

        // --- REGEX FALLBACK (From Legacy) ---
        // Robust check that excludes related_queries
        const queryPatterns = [
            /"search_query"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
            /"query"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
        ];

        for (const pattern of queryPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const beforeMatch = text.substring(Math.max(0, match.index - 50), match.index);
                if (beforeMatch.includes('related_queries') || beforeMatch.includes('suggested_queries')) continue;

                const query = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                if (query && query.length > 3 && query.length < 500) {
                    queries.add(query);
                }
            }
        }

        if (queries.size === 0) return null;

        const uniqueSources = Array.from(sources.values());
        // Return queries with attached sources (associating all found sources with all found queries in this chunk for simplicity)
        return Array.from(queries).map(q => ({
            text: q,
            sources: uniqueSources.length > 0 ? uniqueSources : undefined
        }));
    },
};
