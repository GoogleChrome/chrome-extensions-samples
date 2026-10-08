import { describe, expect, it } from "vitest";
import { GeminiContext } from "./gemini";

describe("GeminiContext.shouldIntercept", () => {
    // No coverage existed for shouldIntercept at all before this -- a real gap that let a
    // real bug ship silently (found live 2026-10-08): the actual message-generation
    // endpoint uses PascalCase ("StreamGenerate"), which the lowercase "/generate"/"/stream"
    // substring checks never matched, so only incidental batchexecute side-calls were ever
    // intercepted -- never the real response carrying groundingMetadata/webSearchQueries.
    it("matches the real StreamGenerate RPC endpoint (PascalCase -- previously missed)", () => {
        const url =
            "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_gemini-web-uiserver_20261007.01_p0&f.sid=abc&hl=en-GB&_reqid=123&rt=c";
        expect(GeminiContext.shouldIntercept(url)).toBe(true);
    });

    it("still matches the batchexecute endpoint", () => {
        const url =
            "https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=aPya6c&source-path=%2Fapp&bl=x&f.sid=abc&hl=en-GB&_reqid=123&rt=c";
        expect(GeminiContext.shouldIntercept(url)).toBe(true);
    });

    it("rejects a non-Gemini domain", () => {
        expect(GeminiContext.shouldIntercept("https://claude.ai/api/organizations/x")).toBe(false);
    });

    it("rejects a Gemini static asset URL with no matching path segment", () => {
        expect(GeminiContext.shouldIntercept("https://gemini.gstatic.com/_/mss/some.js")).toBe(false);
    });
});

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

    describe("false-positive regression (found live 2026-10-08 against the real product)", () => {
        it("does not treat an ordinary {text: ...} response fragment as a search query", () => {
            // The exact shape of the live false positive: a plain response-text
            // chunk, structurally identical to countless others in a real
            // conversational turn, with nothing marking it as a query.
            const json = JSON.stringify({ text: "I've been curious about how glaciers form over time" });
            const text = `)]}'\n50\n${json}\n`;
            expect(GeminiContext.extract(text)).toBeNull();
        });

        it("still finds a real query via a more specific key even when a text field is also present", () => {
            const json = JSON.stringify({
                text: "Here is what I found about your question",
                query: "glacier formation process",
            });
            const result = GeminiContext.extract(`)]}'\n50\n${json}\n`);
            expect(result?.map((r) => r.text)).toEqual(["glacier formation process"]);
        });

        it("does not treat an apostrophe inside a contraction as a quote delimiter in the regex fallback", () => {
            // The exact live bug (found 2026-10-08, re-testing after the "text"-key
            // fix above): the regex fallback's last-resort "quoted term" matcher
            // used to accept `'` as a quote character, so the apostrophe in "I've"
            // was misread as an opening quote -- everything after it, up to the
            // next apostrophe/quote, got captured as a fake query ("ve been
            // curious about today" in this shape, "ve been curious about" live).
            const json = JSON.stringify({ text: "I've been curious about today's weather patterns" });
            const text = `)]}'\n50\n${json}\n`;
            expect(GeminiContext.extract(text)).toBeNull();
        });
    });

    describe("webSearchQueries array shape (Gemini's public grounding API exposes queries this way)", () => {
        it("extracts every string from a webSearchQueries array", () => {
            const json = JSON.stringify({
                groundingMetadata: { webSearchQueries: ["current weather in Vienna Austria", "Vienna Austria forecast today"] },
            });
            const result = GeminiContext.extract(`)]}'\n50\n${json}\n`);
            expect(result?.map((r) => r.text).sort()).toEqual(
                ["Vienna Austria forecast today", "current weather in Vienna Austria"].sort()
            );
        });

        it("ignores non-string entries in the array without throwing", () => {
            const json = JSON.stringify({ searchQueries: ["a real query here", null, 42] });
            const result = GeminiContext.extract(`)]}'\n50\n${json}\n`);
            expect(result?.map((r) => r.text)).toEqual(["a real query here"]);
        });
    });
});
