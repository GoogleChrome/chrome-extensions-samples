import { describe, expect, it, vi } from "vitest";

/**
 * Regression test for a live bug found during the v2.0 manual verification
 * pass on claude.ai, discovered immediately after fixing the sibling
 * AbortSignal bug: a `Headers` instance is ALSO not structured-cloneable.
 * `fetch(url, { headers: new Headers({...}) })` is a very common pattern
 * (Headers is the standard way to build a header set), and the interceptor
 * forwarded it to the worker wholesale the same way it forwarded `signal`,
 * producing `DataCloneError: Failed to execute 'postMessage' on 'Worker':
 * Headers object could not be cloned.` This is why the fix is a general
 * `sanitizeInit` rather than a one-off `stripSignal` -- the bug is "any
 * non-cloneable value in RequestInit", not just AbortSignal specifically.
 *
 * Own file for the same reason as the other two worker-forwarding
 * regression tests: a fresh module graph is needed so a real-looking Worker
 * is available from the first call.
 */
describe("fetch hook: a Headers instance must never reach postMessage", () => {
    it("converts a Headers instance to a plain array before forwarding to the worker", async () => {
        const nativeFetch = window.fetch;

        const posted: unknown[] = [];
        class FakeWorker {
            onmessage: ((e: MessageEvent) => void) | null = null;
            onerror: (() => void) | null = null;
            postMessage(data: unknown): void {
                assertStructuredCloneable(data);
                posted.push(data);
                const { id } = data as { id: number };
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

        await expect(
            window.fetch("https://claude.ai/api/organizations/abc/chat_conversations/def/completion", {
                method: "POST",
                body: "{}",
                headers: new Headers({ "content-type": "application/json" }),
            })
        ).resolves.toBeInstanceOf(Response);

        expect(posted).toHaveLength(1);
        const sent = posted[0] as { init: { headers?: unknown } };
        expect(sent.init.headers instanceof Headers).toBe(false);
        expect(sent.init.headers).toEqual(expect.arrayContaining([["content-type", "application/json"]]));

        Object.defineProperty(window, "fetch", { value: nativeFetch, writable: true, configurable: true });
        vi.unstubAllGlobals();
    }, 15000);
});

/** Mimics the subset of the structured clone algorithm relevant here: throws
 * the same error real postMessage throws when handed a non-cloneable value
 * (a Headers instance is the one this bug cares about). */
function assertStructuredCloneable(value: unknown, seen = new Set<unknown>()): void {
    if (!value || typeof value !== "object") return;
    if (value instanceof Headers) {
        throw new DOMException(
            "Failed to execute 'postMessage' on 'Worker': Headers object could not be cloned.",
            "DataCloneError"
        );
    }
    if (seen.has(value)) return;
    seen.add(value);
    if (value instanceof ReadableStream) return; // transferable, not plain-cloned
    if (Array.isArray(value)) {
        value.forEach((v) => assertStructuredCloneable(v, seen));
        return;
    }
    for (const key of Object.keys(value as Record<string, unknown>)) {
        assertStructuredCloneable((value as Record<string, unknown>)[key], seen);
    }
}
