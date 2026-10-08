import { describe, expect, it, vi } from "vitest";

/**
 * Regression test for a live bug found during the v2.0 manual verification
 * pass: an in-flight fetch carrying an AbortSignal (e.g. any React app using
 * AbortController to cancel requests -- observed live breaking ChatGPT's own
 * message-send and telemetry calls) that gets routed through the hook-cycle
 * worker-escape path used to throw `DataCloneError: ... AbortSignal object
 * could not be cloned` and silently reject, because AbortSignal isn't
 * structured-cloneable and the interceptor forwarded `init` (including
 * `signal`) to the worker wholesale.
 *
 * This file imports interceptor.ts fresh (separate module graph from
 * interceptor.test.ts) specifically so a real-looking Worker is available
 * from the first call -- interceptor.ts caches `workerUnusable` at module
 * scope once any worker construction attempt fails, so sharing a module
 * instance with a test that deliberately stubs `Worker` as unavailable would
 * make this test unable to ever reach the postMessage call it needs to
 * verify.
 */
describe("fetch hook: AbortSignal must never reach postMessage", () => {
    let nativeFetch: typeof window.fetch;

    it("strips signal before forwarding a re-entrant fetch to the worker", async () => {
        nativeFetch = window.fetch;

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

        const controller = new AbortController();
        const downstream = window.fetch;
        const hostile = function (this: unknown, ...args: [RequestInfo | URL, RequestInit?]) {
            return (downstream as typeof fetch).apply(this, args);
        };
        (window as unknown as Record<string, unknown>).fetch = hostile;

        await expect(
            window.fetch("https://chatgpt.com/backend-api/f/conversation", {
                method: "POST",
                body: "{}",
                signal: controller.signal,
            })
        ).resolves.toBeInstanceOf(Response);

        expect(posted).toHaveLength(1);
        expect(posted[0]).not.toHaveProperty("init.signal");

        Object.defineProperty(window, "fetch", { value: nativeFetch, writable: true, configurable: true });
        vi.unstubAllGlobals();
    }, 15000);
});

/** Mimics the subset of the structured clone algorithm relevant here: throws
 * the same error real postMessage throws when handed a non-cloneable value
 * (AbortSignal is the one this bug cares about). */
function assertStructuredCloneable(value: unknown, seen = new Set<unknown>()): void {
    if (!value || typeof value !== "object") return;
    if (typeof AbortSignal !== "undefined" && value instanceof AbortSignal) {
        throw new DOMException(
            "Failed to execute 'postMessage' on 'Worker': AbortSignal object could not be cloned.",
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
