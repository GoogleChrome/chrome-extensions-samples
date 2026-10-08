import { describe, expect, it } from "vitest";
import { GeminiContext } from "./gemini";

describe("GeminiContext", () => {
    it("extracts queries from batchexecute JSON via the generic key fallback", () => {
        const simpleJson = JSON.stringify({
            root: {
                query: "gemini search query",
            },
        });

        const text = `)]}'\n123\n${simpleJson}\n`;

        const nodes = GeminiContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("gemini search query");
    });

    it("extracts sources from groundingMetadata", () => {
        const json = JSON.stringify({
            groundingMetadata: {
                citations: [
                    {
                        url: "https://gemini.test",
                        title: "Gemini Source",
                    },
                ],
            },
            query: "test query",
        });

        const text = `)]}'\n123\n${json}\n`;

        const nodes = GeminiContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("test query");
        expect(nodes?.[0].sources).toHaveLength(1);
        expect(nodes?.[0].sources?.[0].url).toBe("https://gemini.test");
    });

    describe("real batchexecute structure (closes a gap: the original tests only covered the fallback)", () => {
        // root[0][0][3][1][0][0] -- the exact nested array-of-arrays shape
        // gemini.ts's path matching looks for, built by hand since no live
        // capture pipeline exists. Exercises the structural walk, not the
        // regex fallback (verified below by using a query the fallback's
        // quoted-term heuristic would also accept, but confirming it comes
        // from a single parse, not a coincidental double match).
        function buildBatchExecutePart(query: string): string {
            const root = [[[null, null, null, [null, [[query]]]]]];
            return JSON.stringify(root);
        }

        it("finds a search query via the real path-indexed array structure", () => {
            const query = "find the latest government policy update today";
            const text = `)]}'\n999\n${buildBatchExecutePart(query)}\n`;

            const nodes = GeminiContext.extract(text);
            expect(nodes).toHaveLength(1);
            expect(nodes?.[0].text).toBe(query);
        });

        it("skips strings at the known title-noise path ([2][X][1]) even when they'd otherwise pass the heuristic", () => {
            // Same string, but sitting at a contiguous [2, X, 1] path segment --
            // the pattern gemini.ts treats as title noise, never a query.
            const title = "find the latest government policy update today";
            const root = [null, null, [null, [null, title]]]; // path to `title`: [2, 1, 1]
            const text = `)]}'\n999\n${JSON.stringify(root)}\n`;

            expect(GeminiContext.extract(text)).toBeNull();
        });

        it("re-parses a nested JSON-encoded string at array index 2 and finds queries inside it", () => {
            const inner = JSON.stringify({ query: "nested reparsed query" });
            const root = [null, null, inner]; // index 2 holds a JSON-encoded string
            const text = `)]}'\n999\n${JSON.stringify(root)}\n`;

            const nodes = GeminiContext.extract(text);
            expect(nodes?.map((n) => n.text)).toContain("nested reparsed query");
        });

        it("rejects a query-shaped string that fails the heuristic (too short, or looks like a URL)", () => {
            const tooShort = "find it";
            const root = [[[null, null, null, [null, [[tooShort]]]]]];
            const text = `)]}'\n999\n${JSON.stringify(root)}\n`;

            expect(GeminiContext.extract(text)).toBeNull();
        });
    });

    it("returns null when there is no search activity", () => {
        const text = `)]}'\n10\n${JSON.stringify({ answer: "hello" })}\n`;
        expect(GeminiContext.extract(text)).toBeNull();
    });
});
