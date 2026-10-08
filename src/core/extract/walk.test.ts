import { describe, expect, it } from "vitest";
import { pathContains, pathEndsWith, walkJson, type PathSegment } from "./walk";

describe("walkJson", () => {
    it("visits every node with the real path (array indices and object keys)", () => {
        const seen: { path: PathSegment[]; node: unknown }[] = [];
        walkJson({ a: [1, { b: 2 }] }, (node, path) => {
            seen.push({ path: [...path], node });
        });
        expect(seen).toEqual(
            expect.arrayContaining([
                { path: [], node: { a: [1, { b: 2 }] } },
                { path: ["a"], node: [1, { b: 2 }] },
                { path: ["a", 0], node: 1 },
                { path: ["a", 1], node: { b: 2 } },
                { path: ["a", 1, "b"], node: 2 },
            ]),
        );
    });

    it("stops descending into a subtree when the visitor returns \"skip\"", () => {
        const visited: PathSegment[][] = [];
        walkJson({ keep: { x: 1 }, skipMe: { x: 2 } }, (_node, path) => {
            visited.push([...path]);
            if (path[0] === "skipMe") return "skip";
            return undefined;
        });
        expect(visited).toContainEqual(["keep", "x"]);
        expect(visited).not.toContainEqual(["skipMe", "x"]);
    });

    it("matches a real path segment directly instead of regexing a formatted string", () => {
        // Regression target: gemini.ts used to build "[0][0][3][1][2]" and regex it.
        const hits: unknown[] = [];
        walkJson([["a", ["b", ["target"]]]], (node, path) => {
            if (path[0] === 0 && path[2] === 1 && path[3] === 0) hits.push(node);
        });
        expect(hits).toEqual(["target"]);
    });

    it("resumes from a given basePath, for walking a re-parsed nested JSON string in context", () => {
        const seen: PathSegment[][] = [];
        walkJson({ x: 1 }, (_node, path) => { seen.push([...path]); }, [0, "(parsed)"]);
        expect(seen).toContainEqual([0, "(parsed)", "x"]);
    });
});

describe("pathContains", () => {
    it("matches a contiguous number subsequence anywhere in the path", () => {
        expect(pathContains(["a", 2, 5, 1, "c"], [2, null, 1])).toBe(true);
    });

    it("does not match when the subsequence is out of order, non-contiguous, or absent", () => {
        expect(pathContains([1, 2, 3], [3, 2, 1])).toBe(false);
        expect(pathContains(["a", 2, "b", 1, "c"], [2, null, 1])).toBe(false); // "b" breaks contiguity
        expect(pathContains([2, "x"], [2, null, 1])).toBe(false);
    });
});

describe("pathEndsWith", () => {
    it("matches when the path's final segments equal the suffix pattern", () => {
        expect(pathEndsWith([0, 0, 3, 1, 7, 0], [0, 0, 3, 1, null, 0])).toBe(true);
    });

    it("does not match a shorter path or a non-matching suffix", () => {
        expect(pathEndsWith([3, 1, 0], [0, 0, 3, 1, null, 0])).toBe(false);
        expect(pathEndsWith([0, 0, 3, 1, 7, 1], [0, 0, 3, 1, null, 0])).toBe(false);
    });
});
