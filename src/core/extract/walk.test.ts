import { describe, expect, it } from "vitest";
import { walkJson, type PathSegment } from "./walk";

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
});
