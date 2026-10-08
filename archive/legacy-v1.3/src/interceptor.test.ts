import { describe, expect, it, vi, beforeAll, afterAll } from "vitest";

/**
 * Coexistence regression test for the MAIN-world fetch hook.
 *
 * Reproduces the live crash (Sept 2026): a co-installed capture tool wraps
 * window.fetch and routes back into our wrapper, producing unbounded
 * o -> w -> o -> w recursion and `RangeError: Maximum call stack size
 * exceeded`, which took down every page fetch (Datadog, Statsig, chat).
 *
 * The hook must instead terminate re-entrant calls via the pristine
 * worker-native path — degrading to a descriptive rejection where no
 * Worker exists (jsdom) rather than overflowing the stack.
 */
describe("fetch hook coexistence", () => {
    let nativeFetch: typeof window.fetch;

    beforeAll(async () => {
        nativeFetch = window.fetch;
        await import("./interceptor");
    });

    afterAll(() => {
        // Fully restore a plain data property so nothing leaks between files.
        Object.defineProperty(window, "fetch", {
            value: nativeFetch,
            writable: true,
            configurable: true,
        });
    });

    it("passes normal traffic through untouched", async () => {
        const res = await window.fetch("data:text/plain,hello-guard-test");
        expect(await res.text()).toBe("hello-guard-test");
    });

    it("survives a hostile wrapper that routes back into us (no stack overflow)", async () => {
        vi.stubGlobal("Worker", undefined);
        // Hostile wrapper mimicking the observed tool: captures whatever
        // window.fetch currently yields (our wrapper) and delegates back.
        const downstream = window.fetch;
        const hostile = function (this: unknown, ...args: [RequestInfo | URL, RequestInit?]) {
            return (downstream as typeof fetch).apply(this, args);
        };
        // Plain assignment hits OUR setter, which adopts it as downstream —
        // closing the o -> w -> o cycle exactly like production.
        (window as unknown as Record<string, unknown>).fetch = hostile;

        // Must REJECT via the guard path, never throw RangeError.
        await expect(
            window.fetch("https://chatgpt.com/backend-api/f/conversation", {
                method: "POST",
                body: "{}",
            } as RequestInit)
        ).rejects.toThrow(/hook-cycle guard|worker fetch/i);
    }, 15000);
});
