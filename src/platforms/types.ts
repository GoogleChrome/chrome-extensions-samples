export interface Source {
    url: string;
    title?: string;
    favicon?: string;
}

export interface ExtractedQuery {
    text: string;
    sources?: Source[];
    /** Search backend that served this query (ChatGPT turn-stream `search_engine`, e.g. "serpapi"). */
    searchEngine?: string;
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
}
