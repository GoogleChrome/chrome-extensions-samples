import { describe, expect, it, vi } from "vitest";

/**
 * Regression test for a live bug found during the v2.0 manual verification
 * pass on claude.ai: a dedicated Worker spawned from a blob: URL has its own
 * base URL (the blob URL itself), not the page's origin. A relative-path
 * fetch call -- the common case for same-origin SPA requests, e.g.
 * `fetch("/api/organizations/.../completion")` -- forwarded to the worker
 * verbatim fails there with "Failed to parse URL from /api/organizations/...",
 * because a relative path can't resolve against a blob: base. This broke
 * every claude.ai request that happened to take the hook-cycle-escape path
 * (claude.ai's own Datadog RUM script also wraps window.fetch, so this path
 * was taken constantly there), surfacing to the user as "Connection lost."
 *
 * Own file, same reasoning as interceptor.signal.test.ts: a fresh module
 * graph is needed so a real-looking Worker is available from the first call.
 */
describe("fetch hook: relative URLs must resolve before crossing into the worker", () => {
    it("resolves a relative path against the page origin before posting it to the worker", async () => {
        const nativeFetch = window.fetch;

        const posted: { url: string }[] = [];
        class FakeWorker {
            onmessage: ((e: MessageEvent) => void) | null = null;
            onerror: (() => void) | null = null;
            postMessage(data: unknown): void {
                const { id, url } = data as { id: number; url: string };
                // Mimics a dedicated Worker's own fetch: relative URLs cannot
                // resolve against a blob: base, only absolute ones can be used.
                let parsed: URL;
                try {
                    parsed = new URL(url);
                } catch {
                    queueMicrotask(() => {
                        this.onmessage?.({
                            data: { id, ok: false, error: `Failed to parse URL from ${url}` },
                        } as MessageEvent);
                    });
                    return;
                }
                posted.push({ url: parsed.toString() });
                queueMicrotask(() => {
                    this.onmessage?.({
                        data: { id, ok: true, status: 200, statusText: "OK", headers: [], body: null },
                    } as MessageEvent);
                });
            }
            terminate(): void {}
        }
        vi.stubGlobal("Worker", FakeWorker as unknown as typeof Worker);
        vi.stubGlobal(
            "URL",
            class extends URL {
                static createObjectURL(): string {
                    return "blob:fake";
                }
            } as unknown as typeof URL
        );

        await import("./interceptor");

        const downstream = window.fetch;
        const hostile = function (this: unknown, ...args: [RequestInfo | URL, RequestInit?]) {
            return (downstream as typeof fetch).apply(this, args);
        };
        (window as unknown as Record<string, unknown>).fetch = hostile;

        // A relative path, exactly like claude.ai's own same-origin API calls.
        await expect(
            window.fetch("/api/organizations/abc/chat_conversations/def/completion", { method: "POST", body: "{}" })
        ).resolves.toBeInstanceOf(Response);

        expect(posted).toHaveLength(1);
        expect(posted[0].url).toBe(new URL("/api/organizations/abc/chat_conversations/def/completion", window.location.href).toString());

        Object.defineProperty(window, "fetch", { value: nativeFetch, writable: true, configurable: true });
        vi.unstubAllGlobals();
    }, 15000);
});
