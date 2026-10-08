import { describe, expect, it } from "vitest";
import { mergeQueries, mergeQuery, pruneConversations } from "./merge";
import { MAX_QUERIES_PER_CONVERSATION, type CapturedQuery } from "./types";

function q(overrides: Partial<CapturedQuery> & { text: string }): CapturedQuery {
    return { timestamp: 0, ...overrides };
}

describe("mergeQuery", () => {
    it("prepends a new query", () => {
        const existing = [q({ text: "old" })];
        const next = mergeQuery(existing, q({ text: "new" }));
        expect(next.map((x) => x.text)).toEqual(["new", "old"]);
    });

    it("trims whitespace and ignores empty text", () => {
        const next = mergeQuery([], q({ text: "  padded  " }));
        expect(next).toEqual([q({ text: "padded" })]);
        expect(mergeQuery([], q({ text: "   " }))).toEqual([]);
    });

    it("dedupes by exact trimmed text instead of adding a duplicate row", () => {
        const existing = [q({ text: "same" })];
        const next = mergeQuery(existing, q({ text: "same" }));
        expect(next).toHaveLength(1);
    });

    it("fills in missing metadata on an existing query without overwriting what's already set", () => {
        const existing = [q({ text: "same", searchEngine: "serpapi" })];
        const next = mergeQuery(
            existing,
            q({ text: "same", searchEngine: "bing-image", turnUseCase: "shopping" }),
        );
        expect(next[0].searchEngine).toBe("serpapi"); // first sighting wins, never overwritten
        expect(next[0].turnUseCase).toBe("shopping"); // but a missing field gets filled in
    });

    it("replaces sources wholesale when the existing query had none yet", () => {
        const existing = [q({ text: "same" })];
        const sources = [{ url: "https://a.example", cited: false }];
        const next = mergeQuery(existing, q({ text: "same", sources }));
        expect(next[0].sources).toEqual(sources);
    });

    it("promotes cited=true onto an existing source by url without adding new rows", () => {
        const existing = [
            q({
                text: "same",
                sources: [
                    { url: "https://a.example", cited: false },
                    { url: "https://b.example", cited: false },
                ],
            }),
        ];
        const next = mergeQuery(
            existing,
            q({
                text: "same",
                sources: [
                    { url: "https://a.example", cited: true },
                    { url: "https://c.example", cited: true }, // not already present: ignored
                ],
            }),
        );
        expect(next[0].sources).toHaveLength(2);
        expect(next[0].sources?.find((s) => s.url === "https://a.example")?.cited).toBe(true);
        expect(next[0].sources?.find((s) => s.url === "https://b.example")?.cited).toBe(false);
    });

    it("caps the list at MAX_QUERIES_PER_CONVERSATION, dropping the oldest", () => {
        const existing = Array.from({ length: MAX_QUERIES_PER_CONVERSATION }, (_, i) =>
            q({ text: `q${i}` }),
        );
        const next = mergeQuery(existing, q({ text: "newest" }));
        expect(next).toHaveLength(MAX_QUERIES_PER_CONVERSATION);
        expect(next[0].text).toBe("newest");
        expect(next.some((x) => x.text === `q${MAX_QUERIES_PER_CONVERSATION - 1}`)).toBe(false);
    });

    it("returns the same array reference when nothing actually changed", () => {
        const existing = [q({ text: "same", searchEngine: "serpapi" })];
        const next = mergeQuery(existing, q({ text: "same", searchEngine: "serpapi" }));
        expect(next).toBe(existing);
    });
});

describe("mergeQueries", () => {
    it("folds a batch of incoming queries over an existing list in order", () => {
        const next = mergeQueries([], [q({ text: "a" }), q({ text: "b" })]);
        expect(next.map((x) => x.text)).toEqual(["b", "a"]);
    });
});

describe("pruneConversations", () => {
    it("trims each conversation's queries to the per-conversation cap", () => {
        const map = { c1: Array.from({ length: 5 }, (_, i) => q({ text: `${i}` })) };
        const pruned = pruneConversations(map, 20, 3);
        expect(pruned.c1).toHaveLength(3);
    });

    it("drops the oldest conversations (insertion order) beyond the cap", () => {
        const map = {
            oldest: [q({ text: "x" })],
            middle: [q({ text: "x" })],
            newest: [q({ text: "x" })],
        };
        const pruned = pruneConversations(map, 2, 100);
        expect(Object.keys(pruned)).toEqual(["middle", "newest"]);
    });
});
