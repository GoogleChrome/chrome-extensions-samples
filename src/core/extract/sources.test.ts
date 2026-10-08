import { describe, expect, it } from "vitest";
import { SourceMap } from "./sources";

describe("SourceMap", () => {
    it("ignores an undefined url", () => {
        const map = new SourceMap();
        map.add(undefined);
        expect(map.size).toBe(0);
    });

    it("falls back to the hostname as title when none is given", () => {
        const map = new SourceMap();
        map.add("https://example.com/page");
        expect(map.values()[0].title).toBe("example.com");
    });

    it("keeps the raw url as title when it isn't a parseable URL", () => {
        const map = new SourceMap();
        map.add("not-a-url");
        expect(map.values()[0].title).toBe("not-a-url");
    });

    it("deduplicates by url, filling in missing fields without overwriting existing ones", () => {
        const map = new SourceMap();
        map.add("https://a.example", { title: "First title" });
        map.add("https://a.example", { title: "Second title", snippet: "a snippet" });
        const [source] = map.values();
        expect(source.title).toBe("First title"); // first write wins
        expect(source.snippet).toBe("a snippet"); // missing field gets filled
    });

    it("promotes cited to true the first time any container reports it, never back to false", () => {
        const map = new SourceMap();
        map.add("https://a.example", {}, false);
        map.add("https://a.example", {}, true);
        map.add("https://a.example", {}, false);
        expect(map.values()[0].cited).toBe(true);
    });

    it("sorts cited sources first, then by first-seen order", () => {
        const map = new SourceMap();
        map.add("https://first.example");
        map.add("https://second-cited.example", {}, true);
        map.add("https://third.example");
        expect(map.values().map((s) => s.url)).toEqual([
            "https://second-cited.example",
            "https://first.example",
            "https://third.example",
        ]);
    });
});
