import { describe, expect, it } from "vitest";
import { ChatGPTContext } from "./chatgpt";

describe("ChatGPTContext turn metadata + cited split", () => {
    it("extracts turn_use_case, model_slug, and marks cited vs retrieved", () => {
        const payload = JSON.stringify({
            search_model_queries: ["best ai video analytics construction safety"],
            turn_use_case: "shopping",
            model_slug: "gpt-5",
            working_turn_id: "turn-123",
            search_engine: "serpapi",
            search_result_groups: [
                { entries: [{ url: "https://example.com/a", title: "A", snippet: "retrieved only" }] },
            ],
            content_references: [{ url: "https://cited.com/b", title: "B" }],
        });
        const text = `data: ${payload}`;
        const results = ChatGPTContext.extract(text);
        expect(results).not.toBeNull();
        expect(results!.length).toBe(1);
        const r = results![0];
        expect(r.turnUseCase).toBe("shopping");
        expect(r.modelSlug).toBe("gpt-5");
        expect(r.workingTurnId).toBe("turn-123");
        expect(r.searchEngine).toBe("serpapi");
        const byUrl = new Map((r.sources ?? []).map((s) => [s.url, s]));
        expect(byUrl.get("https://cited.com/b")?.cited).toBe(true);
        expect(byUrl.get("https://example.com/a")?.cited).toBe(false);
        expect(byUrl.get("https://example.com/a")?.snippet).toBe("retrieved only");
        // Cited sorts first.
        expect(r.sources?.[0]?.url).toBe("https://cited.com/b");
    });
});
