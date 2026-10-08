import { IPlatformExtractor } from "./types";

export const GeminiContext: IPlatformExtractor = {
    name: "Gemini",
    shouldIntercept(url: string): boolean {
        const isGeminiDomain = url.includes("gemini.google.com") ||
            url.includes("generativelanguage.googleapis.com") ||
            url.includes("googleapis.com") ||
            url.includes("gstatic.com") ||
            // Support relative URLs when on the Gemini page
            (window.location.hostname.includes("gemini.google") && url.startsWith("/"));

        return isGeminiDomain && (
            url.includes("/api/") ||
            url.includes("/v1/") ||
            url.includes("/generate") ||
            url.includes("/stream") ||
            url.includes("/chat") ||
            url.includes("/search") ||
            url.includes("/models/") ||
            url.includes("generateContent") ||
            url.includes("streamGenerateContent") ||
            url.includes("/_/BardChatUi/data/batchexecute")
        );
    },
    extract(text: string): { text: string; sources?: import("./types").Source[] }[] | null {
        const queries = new Set<string>();
        const sources = new Map<string, import("./types").Source>();

        // Gemini's batchexecute response is prefixed with )]}' and uses a multi-part format
        let cleanText = text.trim();
        if (cleanText.startsWith(")]}'")) {
            cleanText = cleanText.substring(5).trim();
        }

        // Split by pattern: \n<number>\n which demarcates JSON parts
        const jsonParts = cleanText.split(/\n\d+\n/);
        const allJsonData: unknown[] = [];

        for (const part of jsonParts) {
            if (!part.trim()) continue;
            try {
                allJsonData.push(JSON.parse(part));
            } catch (e) {
                // Fallback: Try to find JSON array/object in the response via regex
                const jsonMatch = part.match(/[\[\{][\s\S]*[\]\}]/);
                if (jsonMatch) {
                    try {
                        allJsonData.push(JSON.parse(jsonMatch[0]));
                    } catch (e2) { }
                }
            }
        }

        const findQueries = (obj: unknown, path = ""): void => {
            if (!obj || typeof obj !== "object") return;

            // Skip common noise paths (titles are often at [2][X][1])
            if (path.match(/\[2\]\[(\d+)\]\[1\]/)) return;

            if (Array.isArray(obj)) {
                // Check for the specific structure where search queries are stored: [0][0][3][1][X][0]
                const isSearchQueryParentPath = path.match(/\[0\]\[0\]\[3\]\[1\]\[(\d+)\]$/);

                obj.forEach((item: unknown, index: number) => {
                    const currentPath = `${path}[${index}]`;

                    // Special handling for Gemini batchexecute nested JSON strings (at index 2)
                    if (index === 2 && typeof item === 'string' && item.length > 10) {
                        const trimmed = item.trim();
                        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                            try {
                                const parsed = JSON.parse(item);
                                findQueries(parsed, `${currentPath}(parsed)`);
                            } catch (e) { }
                        }
                    }

                    if (typeof item === "string") {
                        const trimmed = item.trim();
                        const isSearchQueryString = !!isSearchQueryParentPath && index === 0;

                        if (isSearchQueryString) {
                            const words = trimmed.split(/\s+/).filter(w => w.length > 0);

                            // HEURISTICS (From Legacy/interceptor.js)
                            const isSearchQuery =
                                trimmed.length >= 10 && trimmed.length <= 150 &&
                                words.length >= 3 && words.length <= 15 &&
                                !trimmed.includes('http') && !trimmed.includes('@') &&
                                !trimmed.match(/^rc?_[a-f0-9]/i) &&
                                !trimmed.match(/^c_[a-f0-9]+/i) && !trimmed.match(/^r_[a-f0-9]+/i) &&
                                !trimmed.includes('**') && !trimmed.includes('*') && !trimmed.startsWith('#') &&
                                !trimmed.endsWith('.') && !trimmed.endsWith(':') && !trimmed.endsWith('!') && !trimmed.endsWith('?') &&
                                !trimmed.match(/^(What|Why|How|Is|Are|Who|Where|When|Does|Which|Can|Will|Should|Would|Could|May)\s/i) &&
                                !trimmed.match(/^(The|Here|Following|After|Current|Today|This|That|These|Those|A|An|I|You|We|They)\s/i) &&
                                !(words.length <= 3 && trimmed === trimmed.replace(/\b\w/g, l => l.toUpperCase())) &&
                                !(trimmed === trimmed.toUpperCase() && trimmed.length < 30) &&
                                !trimmed.match(/^\d+\.\s/) && !trimmed.startsWith('* ') && !trimmed.startsWith('- ') &&
                                !/^[a-f0-9]{32}$/i.test(trimmed) &&
                                !trimmed.startsWith('SWML_') && !trimmed.includes('\\u003d') &&
                                trimmed.match(/\b(latest|news|update|search|find|information|about|regarding|related to|status|report|case|issue|policy|ban|law|legal|government|mall|pet|Malaysia|December|2025|investigation|challenge|update|today)\b/i);

                            if (isSearchQuery) {
                                console.log("[AI Search Revealer] Gemini Match:", trimmed);
                                queries.add(trimmed);
                            }
                        }
                    }
                    findQueries(item, currentPath);
                });
            } else {
                const record = obj as Record<string, unknown>;
                for (const key in record) {
                    const value = record[key];
                    const currentPath = path ? `${path}.${key}` : key;

                    if ((key === 'query' || key === 'search_query' || key === 'searchQuery' || key === 'search_queries' ||
                        key === 'searchQueryText' || key === 'queryText' || key === 'text') &&
                        typeof value === 'string' && value.length > 5 && value.length < 500) {
                        queries.add(value);
                    }

                    if (key === 'functionCall' && value && typeof value === 'object') {
                        const funcCall = value as { name?: string; args?: { query?: string } };
                        if ((funcCall.name === 'search' || funcCall.name === 'web_search') && funcCall.args?.query) {
                            queries.add(funcCall.args.query);
                        }
                    }

                    if (typeof value === "object" && value !== null) {
                        findQueries(value, currentPath);
                    }
                }

                // Check for groundingMetadata or citations in this object
                const rec = obj as any;
                if (rec.citations && Array.isArray(rec.citations)) {
                    rec.citations.forEach((c: any) => {
                        if (c.url) sources.set(c.url, { url: c.url, title: c.title || new URL(c.url).hostname });
                    });
                }
                if (rec.groundingMetadata?.citations && Array.isArray(rec.groundingMetadata.citations)) {
                    rec.groundingMetadata.citations.forEach((c: any) => {
                        if (c.url) sources.set(c.url, { url: c.url, title: c.title || new URL(c.url).hostname });
                    });
                }
            }
        };

        allJsonData.forEach(data => findQueries(data));

        // Regex Fallback (From Legacy)
        if (queries.size === 0) {
            const queryPatterns = [
                /"query"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
                /"search_query"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
                /"searchQuery"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
            ];
            for (const pattern of queryPatterns) {
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    const q = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    if (q.length > 10 && q.length < 150 && !q.includes('http')) queries.add(q);
                }
            }

            // Pattern 2: Look for quoted search terms in the response text (From Legacy)
            const quotedTermPattern = /(?:^|[^\\])["']([a-zA-Z][a-zA-Z0-9\s]{2,40}?)(?:["']|\\["'])/g;
            let m;
            while ((m = quotedTermPattern.exec(text)) !== null) {
                const term = m[1].trim();
                const words = term.split(/\s+/).filter(w => w.length > 0);

                // Very strict filtering - same as nested array detection
                const isSearchQuery =
                    term.length >= 10 && term.length <= 80 &&
                    words.length >= 3 && words.length <= 8 &&
                    !term.toLowerCase().includes('http') && !term.includes('@') &&
                    !term.match(/^c_[a-f0-9]+/i) && !term.match(/^r_[a-f0-9]+/i) &&
                    !term.match(/^rc_[a-f0-9]+/i) && !term.includes('\\u') &&
                    !term.includes('**') && !term.includes('*') &&
                    !term.endsWith('.') && !term.endsWith(':') &&
                    !term.endsWith('!') && !term.endsWith('?') &&
                    !term.match(/^(What|Why|How|Is|Are|Does|Which|Who|When|Where|Can|Will|Should|Would|Could|May)\s/i) &&
                    !term.match(/^(The|Here|Following|After|Current|Today|This|That|These|Those|A|An|I|You|We|They)\s/i) &&
                    term.match(/\b(latest|news|update|search|find|information|about|regarding|related to|status|report|case|issue|policy|ban|law|legal|government|mall|pet|Malaysia|December|2025)\b/i);

                if (isSearchQuery) {
                    queries.add(term);
                }
            }
        }

        if (queries.size > 0) console.log("[AI Search Revealer] Gemini Found total:", queries.size);

        const uniqueSources = Array.from(sources.values());
        return queries.size > 0 ? Array.from(queries).map(q => ({
            text: q,
            sources: uniqueSources.length > 0 ? uniqueSources : undefined
        })) : null;
    },
};
