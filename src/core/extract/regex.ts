/** One fallback extraction rule, applied when a chunk's JSON didn't parse cleanly. */
export interface RegexRule {
    /** Must carry the "g" flag — `regexFallback` iterates every match via `exec`. */
    pattern: RegExp;
    extract: (match: RegExpExecArray) => string | undefined;
    /** Return true to discard a match at this position (e.g. inside a "related queries" block). */
    reject?: (text: string, matchIndex: number) => boolean;
}

/**
 * Runs a list of regex-based extraction rules over raw (non-JSON-parseable)
 * text, in order, collecting every accepted match into one set. Used as the
 * last-resort path when a streaming chunk is truncated or otherwise fails to
 * `JSON.parse`.
 */
export function regexFallback(text: string, rules: RegexRule[]): Set<string> {
    const out = new Set<string>();
    for (const rule of rules) {
        rule.pattern.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = rule.pattern.exec(text)) !== null) {
            if (rule.pattern.lastIndex === m.index) rule.pattern.lastIndex += 1; // guard zero-length matches
            if (rule.reject?.(text, m.index)) continue;
            const value = rule.extract(m);
            if (value) out.add(value.trim());
        }
    }
    return out;
}

/** Shared helper for a `reject` rule that excludes matches found inside a named "skip" block (e.g. related/suggested queries). */
export function rejectNearKeywords(keywords: string[], lookbehind = 50): (text: string, matchIndex: number) => boolean {
    return (text, matchIndex) => {
        const context = text.slice(Math.max(0, matchIndex - lookbehind), matchIndex).toLowerCase();
        return keywords.some((k) => context.includes(k.toLowerCase()));
    };
}
