import type { Source } from "../../platforms/types";

/**
 * Deduplicates sources by URL, merging in richer fields only when the
 * existing row is missing them, promoting `cited` to true the first time any
 * container reports it, and sorting cited-first (then by first-seen order)
 * on read — mirrors chatgpt.ts's original citation/search_result_groups
 * merge behavior, now shared by every platform.
 */
export class SourceMap {
    private map = new Map<string, Source>();

    add(url: string | undefined, patch: Partial<Omit<Source, "url" | "cited" | "position">> = {}, cited = false): void {
        if (!url) return;

        const existing = this.map.get(url);
        if (existing) {
            if (cited) existing.cited = true;
            if (patch.title !== undefined && existing.title === undefined) existing.title = patch.title;
            if (patch.favicon !== undefined && existing.favicon === undefined) existing.favicon = patch.favicon;
            if (patch.snippet !== undefined && existing.snippet === undefined) existing.snippet = patch.snippet;
            if (patch.attribution !== undefined && existing.attribution === undefined) existing.attribution = patch.attribution;
            if (patch.pubDate !== undefined && existing.pubDate === undefined) existing.pubDate = patch.pubDate;
            if (patch.resultSource !== undefined && existing.resultSource === undefined) existing.resultSource = patch.resultSource;
            return;
        }

        let title = patch.title;
        if (title === undefined) {
            try {
                title = new URL(url).hostname;
            } catch {
                title = url;
            }
        }
        this.map.set(url, {
            url,
            title,
            favicon: patch.favicon,
            snippet: patch.snippet,
            attribution: patch.attribution,
            pubDate: patch.pubDate,
            resultSource: patch.resultSource,
            position: this.map.size,
            cited,
        });
    }

    get size(): number {
        return this.map.size;
    }

    /** Cited sources first, then insertion order. */
    values(): Source[] {
        return [...this.map.values()].sort(
            (a, b) => Number(b.cited ?? false) - Number(a.cited ?? false) || (a.position ?? 0) - (b.position ?? 0),
        );
    }
}
