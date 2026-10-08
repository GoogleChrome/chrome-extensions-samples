import { describe, expect, it } from "vitest";
import { ClaudeContext } from "./claude";

describe("ClaudeContext", () => {
    it("extracts queries from JSON tool_use", () => {
        const text = JSON.stringify({
            chat_messages: [
                {
                    content: [
                        { type: "text", text: "Thinking..." },
                        { type: "tool_use", name: "web_search", input: { query: "claude search query" } }
                    ]
                }
            ]
        });

        const nodes = ClaudeContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("claude search query");
    });

    it("extracts queries from streaming regex fallback", () => {
        // Simulating a partial stream chunk
        const text = '... "type": "tool_use", "name": "web_search", "input": { "query": "streaming query" } ...';

        const nodes = ClaudeContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("streaming query");
    });
});
