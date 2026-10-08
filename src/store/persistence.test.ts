import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CapturedQuery } from "../core/types";
import { loadPersisted, savePersisted, STORAGE_KEY } from "./persistence";

function mockChromeStorage(initial: Record<string, unknown> = {}): { data: Record<string, unknown> } {
    const state = { data: { ...initial } };
    (globalThis as unknown as { chrome: unknown }).chrome = {
        storage: {
            local: {
                get: vi.fn((keyOrKeys: string) => {
                    const key = keyOrKeys;
                    return Promise.resolve(key in state.data ? { [key]: state.data[key] } : {});
                }),
                set: vi.fn((items: Record<string, unknown>) => {
                    Object.assign(state.data, items);
                    return Promise.resolve();
                }),
            },
        },
    };
    return state;
}

function q(text: string): CapturedQuery {
    return { text, timestamp: 0 };
}

describe("persistence", () => {
    beforeEach(() => {
        mockChromeStorage();
    });

    it("loadPersisted returns an empty array when nothing is stored", async () => {
        expect(await loadPersisted("key1")).toEqual([]);
    });

    it("round-trips queries through savePersisted/loadPersisted", async () => {
        const result = await savePersisted("key1", [q("a"), q("b")]);
        expect(result.ok).toBe(true);
        expect(await loadPersisted("key1")).toEqual([q("a"), q("b")]);
    });

    it("keeps separate conversations independent", async () => {
        await savePersisted("key1", [q("a")]);
        await savePersisted("key2", [q("b")]);
        expect(await loadPersisted("key1")).toEqual([q("a")]);
        expect(await loadPersisted("key2")).toEqual([q("b")]);
    });

    it("migrates the legacy unversioned key once, without touching it", async () => {
        const state = mockChromeStorage({ "csr:capturesByConversation": { legacyKey: [q("legacy")] } });
        expect(await loadPersisted("legacyKey")).toEqual([q("legacy")]);
        // The legacy key itself is never deleted or rewritten by a read-only load.
        expect(state.data["csr:capturesByConversation"]).toEqual({ legacyKey: [q("legacy")] });
    });

    it("writes under the new schema-versioned key", async () => {
        const state = mockChromeStorage();
        await savePersisted("key1", [q("a")]);
        expect((state.data[STORAGE_KEY] as { schemaVersion: number }).schemaVersion).toBe(1);
    });

    it("drops the oldest conversations and reports it when over the byte budget", async () => {
        const bigSnippet = "x".repeat(50_000);
        const bigQuery: CapturedQuery = { text: "q", timestamp: 0, sources: [{ url: "https://a.example", snippet: bigSnippet }] };

        // Each ~50KB conversation alone fits comfortably under the 90KB budget,
        // but every two of them together don't -- so each save after the first
        // prunes something to stay under budget, cascading as more are added.
        await savePersisted("oldest", [bigQuery]);
        await savePersisted("middle", [bigQuery]);
        const result = await savePersisted("newest", [bigQuery]);

        expect(result.ok).toBe(true);
        expect(result.reason).toBe("too_large");
        expect(result.droppedConversations?.length).toBeGreaterThan(0);
        // The conversation just written must never be the one pruned away.
        expect(await loadPersisted("newest")).toEqual([bigQuery]);
        // At least one earlier conversation didn't survive the cascade.
        const oldestSurvived = (await loadPersisted("oldest")).length > 0;
        const middleSurvived = (await loadPersisted("middle")).length > 0;
        expect(oldestSurvived && middleSurvived).toBe(false);
    });

    it("returns ok:false with reason storage_error when the write itself throws", async () => {
        mockChromeStorage();
        (globalThis as unknown as { chrome: { storage: { local: { set: unknown } } } }).chrome.storage.local.set = vi.fn(() =>
            Promise.reject(new Error("quota exceeded"))
        );
        const result = await savePersisted("key1", [q("a")]);
        expect(result).toEqual({ ok: false, reason: "storage_error" });
    });
});
