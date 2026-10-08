import { describe, expect, it } from "vitest";
import { QueryRegistry } from "./registry";

describe("QueryRegistry", () => {
    it("preserves first-seen order across multiple add() calls", () => {
        const reg = new QueryRegistry();
        reg.add("first");
        reg.add("second");
        reg.add("first"); // repeat, should not move or duplicate
        expect(reg.toExtractedQueries().map((q) => q.text)).toEqual(["first", "second"]);
    });

    it("never overwrites metadata already set by an earlier chunk", () => {
        const reg = new QueryRegistry();
        reg.add("q", { turnUseCase: "shopping", modelSlug: "gpt-5" });
        reg.add("q", { turnUseCase: "travel", modelSlug: "gpt-6" });
        const [result] = reg.toExtractedQueries();
        expect(result.turnUseCase).toBe("shopping");
        expect(result.modelSlug).toBe("gpt-5");
    });

    it("unions engines seen across chunks for the same query into one joined string", () => {
        const reg = new QueryRegistry();
        reg.add("q", { engines: new Set(["serpapi"]) });
        reg.add("q", { engines: new Set(["bing-image"]) });
        expect(reg.toExtractedQueries()[0].searchEngine).toBe("serpapi, bing-image");
    });

    it("never smears engine tags from one chunk onto a different chunk's queries", () => {
        const reg = new QueryRegistry();
        reg.add("a", { engines: new Set(["serpapi"]) });
        reg.add("b"); // no engine in this chunk
        const byText = Object.fromEntries(reg.toExtractedQueries().map((q) => [q.text, q]));
        expect(byText.a.searchEngine).toBe("serpapi");
        expect(byText.b.searchEngine).toBeUndefined();
    });

    it("attaches the same source list to every query, matching today's whole-response flattening", () => {
        const reg = new QueryRegistry();
        reg.add("a");
        reg.add("b");
        reg.setSources([{ url: "https://x.example", cited: true }]);
        const [a, b] = reg.toExtractedQueries();
        expect(a.sources).toEqual(b.sources);
        expect(a.sources).toHaveLength(1);
    });

    it("leaves sources undefined when none were ever set", () => {
        const reg = new QueryRegistry();
        reg.add("q");
        expect(reg.toExtractedQueries()[0].sources).toBeUndefined();
    });
});
