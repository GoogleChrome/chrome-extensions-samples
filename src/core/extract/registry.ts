import type { ExtractedQuery, Source } from "../../platforms/types";

/** Metadata scoped to a single parsed chunk/frame — never smeared onto queries from a different chunk. */
export interface ChunkMeta {
    engines?: Set<string>;
    turnUseCase?: string;
    modelSlug?: string;
    workingTurnId?: string;
}

/**
 * Accumulates queries and their metadata across the chunks of one response,
 * preserving first-seen order and first-seen-wins metadata (a later chunk's
 * tags never overwrite an earlier chunk's — callers get this for free simply
 * by passing a fresh `ChunkMeta` per frame, no extra bookkeeping needed).
 *
 * Sources are handled separately via `setSources()`: every platform that
 * extracts sources today (ChatGPT, Perplexity, Gemini) attaches the exact
 * same whole-response source list to every query in that response — not a
 * per-query or per-chunk list. That's today's real, shipped behavior (not an
 * approximation), so it's preserved here as an explicit, named choice rather
 * than reproduced as an implicit side effect in each platform file.
 */
export class QueryRegistry {
    private order: string[] = [];
    private meta = new Map<string, ChunkMeta>();
    private sharedSources: Source[] = [];

    add(text: string, chunkMeta?: ChunkMeta): void {
        const trimmed = text.trim();
        if (!trimmed) return;

        if (!this.meta.has(trimmed)) {
            this.order.push(trimmed);
            this.meta.set(trimmed, {});
        }

        const entry = this.meta.get(trimmed)!;
        if (chunkMeta?.engines?.size) {
            entry.engines = new Set([...(entry.engines ?? []), ...chunkMeta.engines]);
        }
        if (chunkMeta?.turnUseCase && !entry.turnUseCase) entry.turnUseCase = chunkMeta.turnUseCase;
        if (chunkMeta?.modelSlug && !entry.modelSlug) entry.modelSlug = chunkMeta.modelSlug;
        if (chunkMeta?.workingTurnId && !entry.workingTurnId) entry.workingTurnId = chunkMeta.workingTurnId;
    }

    /** Sets the one source list attached to every query in this response. */
    setSources(sources: Source[]): void {
        this.sharedSources = sources;
    }

    get queryCount(): number {
        return this.order.length;
    }

    toExtractedQueries(): ExtractedQuery[] {
        return this.order.map((text) => {
            const entry = this.meta.get(text)!;
            return {
                text,
                sources: this.sharedSources.length > 0 ? this.sharedSources : undefined,
                searchEngine: entry.engines?.size ? Array.from(entry.engines).join(", ") : undefined,
                turnUseCase: entry.turnUseCase,
                modelSlug: entry.modelSlug,
                workingTurnId: entry.workingTurnId,
            };
        });
    }
}
