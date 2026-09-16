import { describe, expect, it } from "vitest";
import { buildCsv, buildMarkdown } from "./ui/controller";
import { extractBackfillFromPayload, getConversationKey } from "./conversation";

describe("export builders", () => {
    it("builds CSV with cited/retrieved counts", () => {
        const csv = buildCsv([
            {
                text: "best ai video analytics",
                platform: "ChatGPT",
                timestamp: 1,
                searchEngine: "serpapi",
                turnUseCase: "shopping",
                modelSlug: "gpt-5",
                sources: [
                    { url: "https://cited.com", cited: true },
                    { url: "https://other.com", cited: false },
                ],
            },
        ]);
        expect(csv).toContain("query,platform,search_engine,turn_use_case,model_slug");
        expect(csv).toContain("best ai video analytics");
        expect(csv).toContain("serpapi");
    });

    it("builds Markdown with Cited section", () => {
        const md = buildMarkdown([
            {
                text: "q1",
                platform: "ChatGPT",
                timestamp: 1,
                sources: [{ url: "https://cited.com", title: "C", cited: true }],
            },
        ]);
        expect(md).toContain("**Cited:**");
        expect(md).toContain("https://cited.com");
    });
});

describe("conversation helpers", () => {
    it("parses chatgpt conversation key from /c/ urls", () => {
        const win = { location: { href: "https://chatgpt.com/c/abc-123?x=1" } } as unknown as Window;
        expect(getConversationKey(win)).toBe("chatgpt:abc-123");
    });

    it("extracts backfill payload mapping nodes", () => {
        const results = extractBackfillFromPayload({
            mapping: {
                n1: {
                    message: {
                        metadata: {
                            search_model_queries: ["ppe detection construction"],
                            turn_use_case: "shopping",
                        },
                        content: { parts: [] },
                    },
                },
            },
            search_result_groups: [{ entries: [{ url: "https://example.com", title: "E" }] }],
        });
        expect(results.length).toBe(1);
        expect(results[0].text).toBe("ppe detection construction");
        expect(results[0].turnUseCase).toBe("shopping");
    });
});
