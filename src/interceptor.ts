import { ChatGPTContext } from "./platforms/chatgpt";
import { ClaudeContext } from "./platforms/claude";
import { IPlatformExtractor } from "./platforms/types";

(() => {
    const PLATFORMS: IPlatformExtractor[] = [
        ChatGPTContext,
        ClaudeContext,
        // Perplexity and Gemini are added here as their parsers land.
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

    const notifyUI = (results: ReturnType<IPlatformExtractor["extract"]>, platform?: string): void => {
        if (!results || results.length === 0) return;
        log(`Found results for ${platform || "Unknown"}:`, results);
        const message = {
            type: "AI_SEARCH_REVEALER_FOUND" as const,
            results,
            platform,
            conversationId: getConversationId(),
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

    // --- Fetch monitor diagnostics ---
    // Counters prove the hook is alive and seeing traffic. Posted throttled
    // to the UI so the panel can show "net N seen/M hit" -- the fastest way
    // to distinguish "no matching traffic" from "hook not running".
    let seenCount = 0;
    let matchedCount = 0;
    let lastStatsPost = 0;
    const postStats = (): void => {
        const now = Date.now();
        if (now - lastStatsPost < 2000) return;
        lastStatsPost = now;
        const message = { type: "AI_SEARCH_REVEALER_STATS" as const, seen: seenCount, matched: matchedCount };
        try {
            window.postMessage(message, window.location.origin);
        } catch {
            try {
                window.postMessage(message, "*");
            } catch {
                /* ignore */
            }
        }
    };

    // --- window.fetch Override (passive read-only) ---
    // Policy note: this hook NEVER modifies, blocks, or fabricates responses.
    // It clones matching responses and parses the clone locally. All other
    // traffic passes through untouched.
    //
    // Resilient install: other MAIN-world tools may ALSO wrap fetch -- even via
    // an accessor property that swallows plain assignments (we observed one
    // whose setter routes straight to a pristine native fetch, orphaning any
    // wrapper installed by assignment). So we ALWAYS install via our own
    // accessor: later assignments are captured as downstream instead of
    // replacing us, and if someone re-defines the property they capture our
    // wrapper through the getter. Every order chains correctly as long as
    // each side delegates -- which both sides do here.
    // --- Loop-proof native fetch via dedicated Worker ---
    // If our wrapper is ever re-entered synchronously, some downstream hook
    // is routing back into us: delegating again would recurse until stack
    // overflow (observed live with a co-installed capture tool). The terminal
    // path forwards the request to a pristine fetch inside a Web Worker -- a
    // separate JS realm no page hook can wrap, needing no DOM (safe
    // pre-<body>) -- and rebuilds a real streaming Response in-page.
    // Page CSP here is report-only, so blob workers are permitted; if a
    // future enforced CSP blocks construction, the guarded call rejects with
    // a descriptive error (bounded damage) instead of crashing the tab.
    type WorkerFetchOk = {
        ok: true;
        status: number;
        statusText: string;
        headers: [string, string][];
        body: ReadableStream<Uint8Array> | null;
    };
    type WorkerFetchResult = WorkerFetchOk | { ok: false; error: string };

    const WORKER_SRC = `
onmessage = async (e) => {
  const { id, url, init } = e.data;
  try {
    const res = await fetch(url, init);
    const headers = [];
    res.headers.forEach((v, k) => headers.push([k, v]));
    const body = res.body;
    if (body) {
      postMessage({ id, ok: true, status: res.status, statusText: res.statusText, headers, body }, [body]);
    } else {
      postMessage({ id, ok: true, status: res.status, statusText: res.statusText, headers, body: null });
    }
  } catch (err) {
    postMessage({ id, ok: false, error: String((err && err.message) || err) });
  }
};
`;

    let workerInstance: Worker | null = null;
    let workerUnusable = false;
    let workerSeq = 0;
    const workerPending = new Map<number, { resolve: (r: Response) => void; reject: (e: Error) => void }>();

    const getWorker = (): Worker | null => {
        if (workerInstance) return workerInstance;
        if (workerUnusable) return null;
        try {
            if (typeof Worker === "undefined") throw new Error("Worker unavailable");
            const w = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" })));
            w.onmessage = (e: MessageEvent) => {
                const m = e.data as WorkerFetchResult & { id: number };
                const p = workerPending.get(m.id);
                if (!p) return;
                workerPending.delete(m.id);
                if (!m.ok) {
                    p.reject(new Error(`[AI Search Revealer] worker fetch failed: ${(m as { error: string }).error}`));
                    return;
                }
                try {
                    const body = m.body && (m.status === 204 || m.status === 205) ? null : m.body;
                    p.resolve(new Response(body, { status: m.status, statusText: m.statusText, headers: m.headers }));
                } catch (err) {
                    p.reject(err instanceof Error ? err : new Error(String(err)));
                }
            };
            w.onerror = () => {
                workerUnusable = true;
                workerPending.forEach((p) => p.reject(new Error("[AI Search Revealer] worker fetch unavailable")));
                workerPending.clear();
            };
            workerInstance = w;
            return w;
        } catch {
            workerUnusable = true;
            return null;
        }
    };

    // Normalize (input, init) into worker-postable args. Returns null when the
    // body cannot cross realms (e.g. a disturbed stream) -- caller then rejects.
    const toWorkerArgs = (
        input: RequestInfo | URL,
        init?: RequestInit
    ): { url: string; init: RequestInit; transfer?: Transferable[] } | null => {
        try {
            if (typeof input === "string") return { url: input, init: init ?? {} };
            if (input instanceof URL) return { url: input.toString(), init: init ?? {} };
            const req = input as Request;
            const merged: RequestInit = { ...(init ?? {}) };
            if (merged.method === undefined) {
                try {
                    merged.method = req.method;
                } catch {
                    /* ignore */
                }
            }
            if (merged.headers === undefined) {
                const headers: [string, string][] = [];
                try {
                    req.headers.forEach((v, k) => headers.push([k, v]));
                } catch {
                    /* ignore */
                }
                if (headers.length > 0) merged.headers = headers;
            }
            if (merged.body === undefined) {
                const method = (merged.method || "GET").toUpperCase();
                if (method !== "GET" && method !== "HEAD") {
                    let stream: ReadableStream | null = null;
                    try {
                        stream = req.body;
                    } catch {
                        return null;
                    }
                    if (!stream) return null;
                    (merged as Record<string, unknown>).body = stream;
                    return { url: req.url, init: merged, transfer: [stream as unknown as Transferable] };
                }
            }
            return { url: req.url, init: merged };
        } catch {
            return null;
        }
    };

    const workerForward = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const w = getWorker();
        if (!w) {
            return Promise.reject(new Error("[AI Search Revealer] hook-cycle guard active but worker fetch is unavailable"));
        }
        const args = toWorkerArgs(input, init);
        if (!args) {
            return Promise.reject(new Error("[AI Search Revealer] hook-cycle guard: request body cannot cross realms"));
        }
        return new Promise<Response>((resolve, reject) => {
            const id = ++workerSeq;
            workerPending.set(id, { resolve, reject });
            try {
                w.postMessage({ id, url: args.url, init: args.init }, args.transfer ?? []);
            } catch (err) {
                workerPending.delete(id);
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        });
    };

    let downstreamFetch: typeof window.fetch = window.fetch;
    // Synchronous re-entrancy depth. JS runs our prologue atomically (no
    // awaits before delegation), so any depth > 0 means a downstream hook
    // routed back into us -- delegating again would overflow the stack.
    let fetchDepth = 0;
    const MAX_FETCH_DEPTH = 2;
    const ourFetchWrapper = function (this: unknown, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        if (fetchDepth > 0) {
            // Hook cycle detected: terminate via pristine worker fetch.
            // Inner calls skip counting/teeing; the outer frame still parses.
            log("fetch re-entry detected: routing around hook cycle");
            if (fetchDepth >= MAX_FETCH_DEPTH) {
                return Promise.reject(new Error("[AI Search Revealer] fetch hook cycle depth exceeded"));
            }
            return workerForward(input, init);
        }

        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        const platform = PLATFORMS.find((p) => {
            try {
                return p.shouldIntercept(url);
            } catch {
                return false;
            }
        });

        seenCount++;
        if (platform) {
            matchedCount++;
        }
        postStats();

        // Standard fetch call, preserving caller `this` through hook chains.
        fetchDepth++;
        let promise: Promise<Response>;
        try {
            promise = downstreamFetch.apply(this, [input, init]);
        } finally {
            fetchDepth--;
        }

        if (platform) {
            promise
                .then(async (response) => {
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
                })
                .catch((e) => {
                    log("Fetch promise rejected:", e);
                });
        }

        return promise;
    };

    const installFetchHook = (): void => {
        try {
            const existing = Object.getOwnPropertyDescriptor(window, "fetch");
            if (existing && (existing.get || existing.set)) {
                // An accessor is already installed (another hook tool): chain
                // through whatever it currently yields.
                try {
                    const cur = window.fetch;
                    if (typeof cur === "function" && cur !== ourFetchWrapper) downstreamFetch = cur;
                } catch {
                    /* ignore */
                }
            }
            Object.defineProperty(window, "fetch", {
                configurable: true,
                enumerable: existing?.enumerable ?? true,
                get() {
                    return ourFetchWrapper;
                },
                set(v: unknown) {
                    // A later tool assigning window.fetch becomes downstream --
                    // it still runs, and we still observe everything.
                    if (typeof v === "function" && v !== (ourFetchWrapper as unknown)) {
                        downstreamFetch = v as typeof window.fetch;
                    }
                },
            });
            log("fetch hook installed (accessor mode)");
        } catch {
            // Last resort: plain assignment (pre-accessor behavior).
            try {
                window.fetch = ourFetchWrapper;
                log("fetch hook installed (assignment fallback)");
            } catch (e) {
                log("fetch hook install FAILED:", e);
            }
        }
    };
    installFetchHook();

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
            xhr.open = function (this: XMLHttpRequest, ...args: unknown[]) {
                requestUrl = args[1] as string;
                return (originalOpen as (...a: unknown[]) => void).apply(this, args);
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

    // --- window.WebSocket Sniff (passive read-only) ---
    // Insurance against transport drift: if chat streaming ever moves off
    // fetch/XHR/SSE onto sockets, string messages are parsed the same way.
    // Binary frames are ignored; everything passes through untouched.
    const OriginalWebSocket = window.WebSocket;
    if (OriginalWebSocket) {
        try {
            // @ts-expect-error - Monkey-patching global WebSocket
            window.WebSocket = function (this: WebSocket, url: string | URL, protocols?: string | string[]): WebSocket {
                const ws = new OriginalWebSocket(url as string, protocols as string[]);
                try {
                    ws.addEventListener("message", (event) => {
                        try {
                            const data = (event as MessageEvent).data;
                            if (typeof data !== "string") return;
                            if (data.length < 50 || data.length > 500000) return;
                            const lower = data.toLowerCase();
                            if (!lower.includes("search") && !lower.includes("query")) return;
                            for (const p of PLATFORMS) {
                                if (!p.shouldIntercept(url.toString())) continue;
                                try {
                                    const results = p.extract(data);
                                    if (results && results.length > 0) notifyUI(results, p.name);
                                } catch {
                                    /* per-platform parse is best-effort */
                                }
                            }
                        } catch {
                            /* never break page socket traffic */
                        }
                    });
                } catch {
                    /* ignore */
                }
                return ws;
            };
            Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
            window.WebSocket.prototype = OriginalWebSocket.prototype;
        } catch {
            /* ignore */
        }
    }

    log("===== INTERCEPTOR LOADED & READY =====");
})();
