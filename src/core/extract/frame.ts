/** One framed chunk of a streamed response: the raw text, plus its parsed JSON when it parsed cleanly. */
export interface Frame {
    raw: string;
    json: unknown | undefined;
}

function tryParse(raw: string): unknown | undefined {
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}

/** Direct parse, falling back to the largest bracket-matched substring (for payloads with wrapper noise around the JSON). */
function tryParseLoose(raw: string): unknown | undefined {
    const direct = tryParse(raw);
    if (direct !== undefined) return direct;
    const match = raw.match(/[[{][\s\S]*[\]}]/);
    return match ? tryParse(match[0]) : undefined;
}

/**
 * Splits SSE-style text into individual `data: {...}` lines (or bare
 * top-level JSON lines as a non-SSE fallback), parsing each independently.
 * A line that fails to parse (e.g. a truncated streaming chunk) still comes
 * back as a `Frame` with `json: undefined` — callers fall through to a
 * regex-based extraction over `raw` in that case.
 */
export function frameSse(text: string): Frame[] {
    const frames: Frame[] = [];
    for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let raw: string | undefined;
        if (trimmed.startsWith("data: ")) {
            const content = trimmed.slice(6).trim();
            if (!content || content === "[DONE]") continue;
            raw = content;
        } else if (trimmed.length > 20 && trimmed.startsWith("{")) {
            raw = trimmed;
        }
        if (raw === undefined) continue;

        frames.push({ raw, json: tryParse(raw) });
    }
    return frames;
}

/**
 * Unwraps Google's `batchexecute` wire format: strips the `)]}'` XSSI
 * anti-hijacking prefix, then splits the body on the `\n<digit-count>\n`
 * part-length delimiter batchexecute uses between concatenated JSON parts.
 */
export function frameBatchExecute(text: string): Frame[] {
    const body = text.startsWith(")]}'") ? text.slice(4) : text;
    return body
        .split(/\n\d+\n/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((raw) => ({ raw, json: tryParseLoose(raw) }));
}
