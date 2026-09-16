import { ChatGPTContext } from "./platforms/chatgpt";
import { ClaudeContext } from "./platforms/claude";
import { PerplexityContext } from "./platforms/perplexity";
import { GeminiContext } from "./platforms/gemini";
import { IPlatformExtractor } from "./platforms/types";

(() => {
    const PLATFORMS: IPlatformExtractor[] = [
        ChatGPTContext,
        ClaudeContext,
        PerplexityContext,
        GeminiContext,
    ];

    const log = (...args: unknown[]) => {
        console.log("%c[AI Search Revealer Interceptor]", "color: #00f2fe; font-weight: bold; font-size: 12px;", ...args);
    };

    log("Initializing...");

    // Re-entrancy guard: the MAIN-world script can be injected more than once
    // into the same page (duplicate unpacked copies, extension reload/update).
    // Without this, top-level redeclaration kills the whole script with
    // "Identifier 'S' has already been declared" and fetch/XHR get
    // patched twice, producing duplicate captures.
    const LOADED_FLAG = "__AI_SEARCH_REVEALER_INTERCEPTOR_LOADED__";
    if ((window as unknown as Record<string, unknown>)[LOADED_FLAG]) {
        log("Already loaded, skipping re-initialization");
        return;
    }
    (window as unknown as Record<string, unknown>)[LOADED_FLAG] = true;

    const getConversationId = (): string | undefined => {
        try {
            const m = window.location.pathname.match(/\/c\/([a-f0-9-]+)/i);
            return m?.[1];
        } catch {
            return undefined;
        }
    };

    const notifyUI = (results: any[], platform?: string) => { // Use specific type if available, but for now any[] is safe transient
        if (results.length === 0) return;
        log(`Found results for ${platform || 'Unknown'}:`, results);
        const message: any = { // Update strict type below
            type: "AI_SEARCH_REVEALER_FOUND",
            results,
            queries: results.map(r => r.text), // Backwards compat shim if needed, or just use results
            platform,
            conversationId: getConversationId()
        };
        // Restrict to same-origin: the ISOLATED-world content script validates
        // event.origin === window.location.origin. Never use "*".
        try {
            window.postMessage(message, window.location.origin);
        } catch {
            // Fallback for edge cases (e.g. about:blank at document_start):
            // post without origin but content script still validates type + source.
            window.postMessage(message, "*");
        }
    };

    // --- window.fetch Override (passive read-only) ---
    // Policy note: this hook NEVER modifies, blocks, or fabricates responses.
    // It clones matching responses and parses the clone locally. All other
    // traffic passes through untouched.
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : input.url);

        const platform = PLATFORMS.find((p) => {
            try {
                return p.shouldIntercept(url);
            } catch (e) { return false; }
        });

        if (platform) {
            // log(`MATCHED ${platform.name} -> ${url}`);
        }

        // Standard fetch call - avoiding 'this' binding issues globally
        const promise = originalFetch.apply(window, [input, init]);

        if (platform) {
            promise.then(async (response) => {
                if (!response.ok) {
                    log(`Response code ${response.status} for ${platform.name}`);
                    return;
                }
                try {
                    const clone = response.clone();
                    const text = await clone.text();
                    log(`Processing ${text.length} bytes for ${platform.name}`);
                    const results = platform.extract(text);
                    if (results && results.length > 0) notifyUI(results, platform.name);
                } catch (e) {
                    log("Error processing:", e);
                }
            }).catch((e) => {
                log("Fetch promise rejected:", e);
            });
        }

        return promise;
    };

    // --- window.EventSource Override ---
    const OriginalEventSource = window.EventSource;
    if (OriginalEventSource) {
        // @ts-expect-error - Monkey-patching global EventSource
        window.EventSource = function (
            this: EventSource,
            url: string | URL,
            eventSourceInitDict?: EventSourceInit
        ): EventSource {
            log("EventSource created for:", url);
            const es = new OriginalEventSource(url, eventSourceInitDict);
            const platform = PLATFORMS.find((p) => p.shouldIntercept(url.toString()));

            if (platform) {
                es.addEventListener("message", (event) => {
                    const results = platform.extract(`data: ${event.data}`);
                    if (results) notifyUI(results, platform.name);
                });
            }
            return es;
        };

        // Maintain static properties and prototype
        Object.setPrototypeOf(window.EventSource, OriginalEventSource);
        window.EventSource.prototype = OriginalEventSource.prototype;
        // @ts-ignore
        (window.EventSource as unknown as typeof OriginalEventSource).CONNECTING = OriginalEventSource.CONNECTING;
        // @ts-ignore
        (window.EventSource as unknown as typeof OriginalEventSource).OPEN = OriginalEventSource.OPEN;
        // @ts-ignore
        (window.EventSource as unknown as typeof OriginalEventSource).CLOSED = OriginalEventSource.CLOSED;
    }

    // --- window.XMLHttpRequest Override ---
    const OriginalXMLHttpRequest = window.XMLHttpRequest;
    if (OriginalXMLHttpRequest) {
        // @ts-expect-error - Monkey-patching global XMLHttpRequest
        window.XMLHttpRequest = function (this: XMLHttpRequest): XMLHttpRequest {
            const xhr = new OriginalXMLHttpRequest();
            let requestUrl: string | null = null;

            const originalOpen = xhr.open;
            xhr.open = function (this: XMLHttpRequest, ...args: any[]) {
                requestUrl = args[1];
                return originalOpen.apply(this, args as any);
            };

            const handleResponse = () => {
                if (xhr.readyState === 4 && requestUrl) {
                    const platform = PLATFORMS.find((p) => p.shouldIntercept(requestUrl!));
                    if (platform && xhr.responseText) {
                        const results = platform.extract(xhr.responseText);
                        if (results) notifyUI(results, platform.name);
                    }
                }
            };

            xhr.addEventListener("readystatechange", handleResponse);
            xhr.addEventListener("load", handleResponse);

            return xhr;
        };

        Object.setPrototypeOf(window.XMLHttpRequest, OriginalXMLHttpRequest);
        window.XMLHttpRequest.prototype = OriginalXMLHttpRequest.prototype;
    }

    log("===== INTERCEPTOR LOADED & READY =====");
})();
