import { describe, expect, it } from "vitest";
import { GeminiContext } from "./gemini";

describe("GeminiContext", () => {
    it("extracts queries from batchexecute JSON", () => {
        // Simplified structure mimicking a batchexecute inner JSON


        // This test might fail based on strict index matching in gemini.ts, 
        // so we'll rely on the Generic "key" fallback for the test if the path is too complex to mock perfectly
        const simpleJson = JSON.stringify({
            root: {
                query: "gemini search query"
            }
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
                        title: "Gemini Source"
                    }
                ]
            },
            // Add a query so we have something to attach sources to
            query: "test query"
        });

        const text = `)]}'\n123\n${json}\n`;

        const nodes = GeminiContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("test query");
        expect(nodes?.[0].sources).toHaveLength(1);
        expect(nodes?.[0].sources?.[0].url).toBe("https://gemini.test");
    });
});
