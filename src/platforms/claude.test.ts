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

    it("returns null when there is no search activity", () => {
        const text = JSON.stringify({
            chat_messages: [{ content: [{ type: "text", text: "Just chatting." }] }],
        });
        expect(ClaudeContext.extract(text)).toBeNull();
    });

    describe("source extraction (closes a gap: the original extractor never populated sources)", () => {
        it("extracts sources from a web_search_tool_result block", () => {
            const text = JSON.stringify({
                chat_messages: [
                    {
                        content: [
                            { type: "tool_use", name: "web_search", input: { query: "weather today" } },
                            {
                                type: "web_search_tool_result",
                                content: [{ url: "https://weather.example", title: "Weather", page_age: "1 day ago" }],
                            },
                        ],
                    },
                ],
            });

            const nodes = ClaudeContext.extract(text);
            expect(nodes).toHaveLength(1);
            expect(nodes?.[0].sources).toEqual([
                expect.objectContaining({ url: "https://weather.example", title: "Weather", cited: true }),
            ]);
        });

        it("extracts sources from a generic tool_result block with a content array", () => {
            const text = JSON.stringify({
                chat_messages: [
                    {
                        content: [
                            { type: "tool_use", name: "web_search", input: { query: "news today" } },
                            { type: "tool_result", content: [{ url: "https://news.example", title: "News" }] },
                        ],
                    },
                ],
            });

            const nodes = ClaudeContext.extract(text);
            expect(nodes?.[0].sources?.[0]).toMatchObject({ url: "https://news.example", cited: true });
        });

        it("extracts sources from citations on a rendered text block", () => {
            const text = JSON.stringify({
                chat_messages: [
                    {
                        content: [
                            { type: "tool_use", name: "web_search", input: { query: "cited query" } },
                            {
                                type: "text",
                                text: "Some answer.",
                                citations: [{ url: "https://cited.example", title: "Cited" }],
                            },
                        ],
                    },
                ],
            });

            const nodes = ClaudeContext.extract(text);
            expect(nodes?.[0].sources?.[0]).toMatchObject({ url: "https://cited.example", cited: true });
        });

        it("attaches the same source list to every query, matching the other platforms' flattening", () => {
            const text = JSON.stringify({
                chat_messages: [
                    {
                        content: [
                            { type: "tool_use", name: "web_search", input: { query: "first query" } },
                            { type: "tool_use", name: "web_search", input: { query: "second query" } },
                            { type: "tool_result", content: [{ url: "https://shared.example" }] },
                        ],
                    },
                ],
            });

            const nodes = ClaudeContext.extract(text)!;
            expect(nodes).toHaveLength(2);
            expect(nodes[0].sources).toEqual(nodes[1].sources);
        });
    });
});
