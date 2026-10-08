export interface Source {
    url: string;
    title?: string;
    favicon?: string;
    /** Short result snippet where the platform provides one. */
    snippet?: string;
    /** Provider/attribution label where the platform provides one. */
    attribution?: string;
    /** Publication date where the platform provides one. */
    pubDate?: string;
    /** Retrieval backend that returned this result (e.g. Bright Data, Oxylabs, Labrador, SERP). */
    resultSource?: string;
    /** Ordinal position in extraction order. */
    position?: number;
    /** True when the URL also appears in the answer's cited references. */
    cited?: boolean;
}

export interface ExtractedQuery {
    text: string;
    sources?: Source[];
    /** Search backend that served this query (ChatGPT turn-stream `search_engine`, e.g. "serpapi"). */
    searchEngine?: string;
    /** Intent category ChatGPT assigns per turn (e.g. "shopping"). */
    turnUseCase?: string;
    /** Model that produced the turn (e.g. "gpt-5"). */
    modelSlug?: string;
    /** Search-turn grouping id where the platform provides one. */
    workingTurnId?: string;
}

export interface IPlatformExtractor {
    name: string;
    shouldIntercept(url: string): boolean;
    extract(text: string): ExtractedQuery[] | null;
}

export interface InterceptedMessage {
    type: "AI_SEARCH_REVEALER_FOUND";
    queries: string[]; // Keep for backward compat with UI for now? No, let's update.
    results?: ExtractedQuery[]; // Optional for transition? Or just replace "queries"
    platform?: string;
    /** Conversation id parsed from the page URL where available (e.g. chatgpt.com/c/{id}). */
    conversationId?: string;
}

/** Throttled fetch-monitor counters from the MAIN-world interceptor. */
export interface InterceptorStatsMessage {
    type: "AI_SEARCH_REVEALER_STATS";
    seen: number;
    matched: number;
}
