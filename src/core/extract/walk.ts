export type PathSegment = string | number;

/**
 * Called for every node (object, array, and leaf) encountered during a
 * `walkJson` traversal. Return `"skip"` to prevent descending into this
 * node's children (e.g. to exclude a known "related queries" subtree from
 * ever being matched).
 */
export type JsonVisitor = (
    node: unknown,
    path: readonly PathSegment[],
    parent: unknown,
) => void | "skip";

/**
 * Generic recursive walk over an unknown parsed-JSON tree, exposing a real
 * path (array of keys/indices) at each node instead of a formatted string.
 * Platforms match on `path` directly (e.g. `path[2] === 1`) rather than
 * regexing a stringified path like `"[0][0][3][1][2]"`.
 */
export function walkJson(root: unknown, visit: JsonVisitor, basePath: readonly PathSegment[] = []): void {
    const go = (node: unknown, path: PathSegment[], parent: unknown): void => {
        if (visit(node, path, parent) === "skip") return;
        if (Array.isArray(node)) {
            node.forEach((child, i) => go(child, [...path, i], node));
        } else if (node && typeof node === "object") {
            for (const key of Object.keys(node as Record<string, unknown>)) {
                go((node as Record<string, unknown>)[key], [...path, key], node);
            }
        }
    };
    go(root, [...basePath], undefined);
}

/** True when `path` contains the given subsequence anywhere, in order and contiguous. `null` matches any number. */
export function pathContains(path: readonly PathSegment[], pattern: readonly (number | null)[]): boolean {
    for (let start = 0; start + pattern.length <= path.length; start++) {
        if (matchesAt(path, pattern, start)) return true;
    }
    return false;
}

/** True when `path`'s final segments exactly match the given suffix pattern. `null` matches any number. */
export function pathEndsWith(path: readonly PathSegment[], pattern: readonly (number | null)[]): boolean {
    if (path.length < pattern.length) return false;
    return matchesAt(path, pattern, path.length - pattern.length);
}

function matchesAt(path: readonly PathSegment[], pattern: readonly (number | null)[], start: number): boolean {
    for (let i = 0; i < pattern.length; i++) {
        const seg = path[start + i];
        if (typeof seg !== "number") return false;
        if (pattern[i] !== null && seg !== pattern[i]) return false;
    }
    return true;
}
