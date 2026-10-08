import { describe, expect, it } from "vitest";
import { buildCsv, buildMarkdown, buildSourceTooltip, csvCell, safeHostname } from "./export";

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

    it("builds Markdown with a Cited section", () => {
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

describe("csvCell", () => {
    it("quotes values containing commas, quotes, or newlines", () => {
        expect(csvCell("a,b")).toBe('"a,b"');
        expect(csvCell('say "hi"')).toBe('"say ""hi"""');
        expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    });

    it("leaves a plain value untouched", () => {
        expect(csvCell("plain text")).toBe("plain text");
    });

    it("neutralizes a leading formula-trigger character (CSV injection)", () => {
        expect(csvCell("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
        expect(csvCell("+1 (312) 555-0100")).toBe("'+1 (312) 555-0100");
        expect(csvCell("-danger")).toBe("'-danger");
        expect(csvCell("@mention")).toBe("'@mention");
    });

    it("does not neutralize a non-leading occurrence of those characters", () => {
        expect(csvCell("total=5")).toBe("total=5");
    });
});

describe("safeHostname", () => {
    it("strips the www. prefix", () => {
        expect(safeHostname("https://www.example.com/page")).toBe("example.com");
    });

    it("falls back to a truncated raw string for an unparseable url", () => {
        expect(safeHostname("not-a-url")).toBe("not-a-url");
    });
});

describe("buildSourceTooltip", () => {
    it("joins title, snippet, result source, and pub date", () => {
        const tip = buildSourceTooltip({
            url: "https://a.example",
            title: "A",
            snippet: "a snippet",
            resultSource: "serpapi",
            pubDate: "2026-01-01",
        });
        expect(tip).toBe("A — a snippet — via serpapi — 2026-01-01");
    });

    it("falls back to the url when there is no title", () => {
        expect(buildSourceTooltip({ url: "https://a.example" })).toBe("https://a.example");
    });
});
