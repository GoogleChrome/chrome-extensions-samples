import { describe, expect, it } from "vitest";
import { PerplexityContext } from "./perplexity";

describe("PerplexityContext", () => {
    it("should extract search queries and their sources from JSON", () => {
        const input = JSON.stringify({
            search_queries: [{ query: "test query" }],
            citations: [
                { url: "https://example.com", title: "Example Domain" },
                { url: "https://wikipedia.org", title: "Wikipedia" }
            ]
        });
        const text = `data: ${input}`;

        const result = PerplexityContext.extract(text);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(1);
        expect(result![0].text).toBe("test query");

        // This assertion should FAIL initially as we haven't implemented source extraction yet
        expect(result![0].sources).toBeDefined();
        expect(result![0].sources).toHaveLength(2);
        expect(result![0].sources![0].url).toBe("https://example.com");
    });
});
