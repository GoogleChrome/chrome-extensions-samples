import { describe, expect, it } from "vitest";
import { PerplexityContext } from "./perplexity";

describe("PerplexityContext", () => {
    it("extracts search queries and their sources from JSON", () => {
        const input = JSON.stringify({
            search_queries: [{ query: "test query" }],
            citations: [
                { url: "https://example.com", title: "Example Domain" },
                { url: "https://wikipedia.org", title: "Wikipedia" },
            ],
        });
        const text = `data: ${input}`;

        const result = PerplexityContext.extract(text);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(1);
        expect(result![0].text).toBe("test query");
        expect(result![0].sources).toHaveLength(2);
        expect(result![0].sources![0].url).toBe("https://example.com");
    });

    it("rejects queries found inside related_queries/suggested_queries entirely, including nested citations", () => {
        const input = JSON.stringify({
            search_queries: [{ query: "real query" }],
            related_queries: {
                search_queries: [{ query: "should not appear" }],
                citations: [{ url: "https://should-not-appear.example" }],
            },
        });
        const text = `data: ${input}`;

        const result = PerplexityContext.extract(text);
        expect(result!.map((r) => r.text)).toEqual(["real query"]);
        expect(result![0].sources).toBeUndefined();
    });

    it("extracts a query from a search step and sources from its nested results", () => {
        const input = JSON.stringify({
            steps: [
                {
                    step_type: "SEARCH_WEB",
                    search_query: "step query",
                    results: [{ url: "https://step-result.example", name: "Step Result" }],
                },
            ],
        });
        const text = `data: ${input}`;

        const result = PerplexityContext.extract(text);
        expect(result!.map((r) => r.text)).toEqual(["step query"]);
        expect(result![0].sources?.[0]).toMatchObject({ url: "https://step-result.example", title: "Step Result" });
    });

    it("attaches the same source list to every query found in the response", () => {
        const input = JSON.stringify({
            search_queries: [{ query: "a" }, { query: "b" }],
            citations: [{ url: "https://shared.example" }],
        });
        const result = PerplexityContext.extract(`data: ${input}`)!;
        expect(result).toHaveLength(2);
        expect(result[0].sources).toEqual(result[1].sources);
    });

    it("runs the regex fallback even when structured parsing already found queries", () => {
        // A second, truncated chunk appended after a clean one -- the structured
        // walk finds "clean query", and the fallback regex still recovers
        // "fallback query" from the truncated fragment in the same text blob.
        const text = [
            `data: ${JSON.stringify({ search_queries: [{ query: "clean query" }] })}`,
            'data: {"query": "fallback query", "truncated...',
        ].join("\n");

        const result = PerplexityContext.extract(text);
        expect(result!.map((r) => r.text).sort()).toEqual(["clean query", "fallback query"]);
    });

    it("returns null when there is no search activity", () => {
        const text = `data: ${JSON.stringify({ answer: "just a plain reply" })}`;
        expect(PerplexityContext.extract(text)).toBeNull();
    });
});
