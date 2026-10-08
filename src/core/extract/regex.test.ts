import { describe, expect, it } from "vitest";
import { regexFallback, rejectNearKeywords, type RegexRule } from "./regex";

describe("regexFallback", () => {
    it("collects every match from a rule across the text", () => {
        const rule: RegexRule = {
            pattern: /"query"\s*:\s*"([^"]+)"/g,
            extract: (m) => m[1],
        };
        const text = '{"query":"a"} ... {"query":"b"}';
        expect(regexFallback(text, [rule])).toEqual(new Set(["a", "b"]));
    });

    it("runs multiple rules and merges their matches into one set", () => {
        const rules: RegexRule[] = [
            { pattern: /"query"\s*:\s*"([^"]+)"/g, extract: (m) => m[1] },
            { pattern: /"search_query"\s*:\s*"([^"]+)"/g, extract: (m) => m[1] },
        ];
        const text = '{"query":"a","search_query":"b"}';
        expect(regexFallback(text, rules)).toEqual(new Set(["a", "b"]));
    });

    it("discards a match when reject() returns true", () => {
        const rule: RegexRule = {
            pattern: /"query"\s*:\s*"([^"]+)"/g,
            extract: (m) => m[1],
            reject: rejectNearKeywords(["related_queries"], 20),
        };
        const text = `related_queries"query":"skip me" ${"x".repeat(50)} "query":"keep me"`;
        expect(regexFallback(text, [rule])).toEqual(new Set(["keep me"]));
    });

    it("ignores empty extracted values", () => {
        const rule: RegexRule = { pattern: /"q":"([^"]*)"/g, extract: (m) => m[1] };
        expect(regexFallback('"q":""', [rule])).toEqual(new Set());
    });
});

describe("rejectNearKeywords", () => {
    it("rejects a match whose preceding text contains any of the given keywords", () => {
        const reject = rejectNearKeywords(["related_queries", "suggested_queries"]);
        const text = "related_queries context here then MATCH";
        expect(reject(text, text.indexOf("MATCH"))).toBe(true);
    });

    it("accepts a match with no keyword nearby", () => {
        const reject = rejectNearKeywords(["related_queries"]);
        const text = "totally unrelated preceding text then MATCH";
        expect(reject(text, text.indexOf("MATCH"))).toBe(false);
    });

    it("only looks within the given lookbehind window", () => {
        const reject = rejectNearKeywords(["related_queries"], 10);
        const text = `related_queries${"x".repeat(50)}MATCH`;
        expect(reject(text, text.indexOf("MATCH"))).toBe(false);
    });
});
