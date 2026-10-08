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
        reg.beginChunk();
        reg.add("q", { turnUseCase: "shopping", modelSlug: "gpt-5" });
        reg.beginChunk();
        reg.add("q", { turnUseCase: "travel", modelSlug: "gpt-6" });
        const [result] = reg.toExtractedQueries();
        expect(result.turnUseCase).toBe("shopping");
        expect(result.modelSlug).toBe("gpt-5");
    });

    it("unions engines seen across chunks for the same query into one joined string", () => {
        const reg = new QueryRegistry();
        reg.beginChunk();
        reg.add("q", { engines: new Set(["serpapi"]) });
        reg.beginChunk();
        reg.add("q", { engines: new Set(["bing-image"]) });
        expect(reg.toExtractedQueries()[0].searchEngine).toBe("serpapi, bing-image");
    });

    it("never smears engine tags from one chunk onto a different chunk's queries", () => {
        const reg = new QueryRegistry();
        reg.beginChunk();
        reg.add("a", { engines: new Set(["serpapi"]) });
        reg.beginChunk();
        reg.add("b"); // no engine in this chunk
        const byText = Object.fromEntries(reg.toExtractedQueries().map((q) => [q.text, q]));
        expect(byText.a.searchEngine).toBe("serpapi");
        expect(byText.b.searchEngine).toBeUndefined();
    });

    it("attachToAllQueriesInChunk only reaches queries added since the last beginChunk()", () => {
        const reg = new QueryRegistry();
        reg.beginChunk();
        reg.add("from-earlier-chunk");
        reg.beginChunk();
        reg.add("from-this-chunk");
        reg.attachToAllQueriesInChunk([{ url: "https://a.example" }]);
        const byText = Object.fromEntries(reg.toExtractedQueries().map((q) => [q.text, q]));
        expect(byText["from-this-chunk"].sources).toHaveLength(1);
        expect(byText["from-earlier-chunk"].sources).toBeUndefined();
    });

    it("sourcesFor() supports precise per-query attachment independent of chunk scoping", () => {
        const reg = new QueryRegistry();
        reg.add("q");
        reg.sourcesFor("q").add("https://a.example", {}, true);
        expect(reg.toExtractedQueries()[0].sources).toEqual([
            expect.objectContaining({ url: "https://a.example", cited: true }),
        ]);
    });

    it("returns undefined sources (not an empty array) when nothing was ever attached", () => {
        const reg = new QueryRegistry();
        reg.add("q");
        expect(reg.toExtractedQueries()[0].sources).toBeUndefined();
    });
});
