import type { ExtractedQuery, Source } from "../../platforms/types";
import { SourceMap } from "./sources";

/** Metadata scoped to a single parsed chunk/frame — never smeared onto queries from a different chunk. */
export interface ChunkMeta {
    engines?: Set<string>;
    turnUseCase?: string;
    modelSlug?: string;
    workingTurnId?: string;
}

interface QueryEntry extends ChunkMeta {
    sources?: SourceMap;
}

/**
 * Accumulates queries and their metadata across the chunks of one response,
 * preserving first-seen order and first-seen-wins metadata (so a later
 * chunk's tags never overwrite an earlier chunk's). Call `beginChunk()`
 * before processing each new chunk so `attachToAllQueriesInChunk` only
 * reaches queries actually seen in that chunk.
 */
export class QueryRegistry {
    private order: string[] = [];
    private entries = new Map<string, QueryEntry>();
    private chunkQueries = new Set<string>();

    beginChunk(): void {
        this.chunkQueries = new Set<string>();
    }

    add(text: string, chunkMeta?: ChunkMeta): void {
        const trimmed = text.trim();
        if (!trimmed) return;

        if (!this.entries.has(trimmed)) {
            this.order.push(trimmed);
            this.entries.set(trimmed, {});
        }
        this.chunkQueries.add(trimmed);

        const entry = this.entries.get(trimmed)!;
        if (chunkMeta?.engines?.size) {
            entry.engines = new Set([...(entry.engines ?? []), ...chunkMeta.engines]);
        }
        if (chunkMeta?.turnUseCase && !entry.turnUseCase) entry.turnUseCase = chunkMeta.turnUseCase;
        if (chunkMeta?.modelSlug && !entry.modelSlug) entry.modelSlug = chunkMeta.modelSlug;
        if (chunkMeta?.workingTurnId && !entry.workingTurnId) entry.workingTurnId = chunkMeta.workingTurnId;
    }

    /** Precise, per-query source attachment (chatgpt.ts's path). */
    sourcesFor(text: string): SourceMap {
        const trimmed = text.trim();
        let entry = this.entries.get(trimmed);
        if (!entry) {
            // Defensive: callers should add() the query first, but never drop sources if they didn't.
            this.order.push(trimmed);
            entry = {};
            this.entries.set(trimmed, entry);
        }
        if (!entry.sources) entry.sources = new SourceMap();
        return entry.sources;
    }

    /** perplexity/gemini's "attach every source seen in this chunk to every query seen in this chunk" policy. */
    attachToAllQueriesInChunk(sources: Source[]): void {
        if (sources.length === 0) return;
        for (const text of this.chunkQueries) {
            const map = this.sourcesFor(text);
            sources.forEach((s) => map.add(s.url, s, s.cited));
        }
    }

    toExtractedQueries(): ExtractedQuery[] {
        return this.order.map((text) => {
            const entry = this.entries.get(text)!;
            return {
                text,
                sources: entry.sources && entry.sources.size > 0 ? entry.sources.values() : undefined,
                searchEngine: entry.engines?.size ? Array.from(entry.engines).join(", ") : undefined,
                turnUseCase: entry.turnUseCase,
                modelSlug: entry.modelSlug,
                workingTurnId: entry.workingTurnId,
            };
        });
    }
}
