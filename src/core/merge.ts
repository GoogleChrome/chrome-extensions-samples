import type { Source } from "../platforms/types";
import { MAX_QUERIES_PER_CONVERSATION, type CapturedQuery } from "./types";

/**
 * Promotes `cited` flags from `incoming` onto matching URLs in `existing` (by
 * url). Never drops or adds source rows — that's the extraction layer's job
 * (see core/extract/sources.ts); this only upgrades what a later chunk/backfill
 * reveals about sources the query already has.
 */
function promoteCitedFlags(existing: Source[], incoming: Source[] | undefined): Source[] {
    if (!incoming?.length) return existing;
    let changed = false;
    const next = existing.map((s) => {
        if (s.cited) return s;
        const match = incoming.find((i) => i.url === s.url);
        if (match?.cited) {
            changed = true;
            return { ...s, cited: true };
        }
        return s;
    });
    return changed ? next : existing;
}

/**
 * Merges one incoming query into a list, by exact (trimmed) text match.
 * New queries are prepended (newest first) and the list is capped at
 * `MAX_QUERIES_PER_CONVERSATION`, oldest dropped. An existing query is
 * upgraded in place: later-arriving metadata (sources/engine/intent/model/
 * turn id) fills in whatever the first sighting didn't have, never
 * overwriting a value that's already set.
 */
export function mergeQuery(existing: CapturedQuery[], incoming: CapturedQuery): CapturedQuery[] {
    const text = incoming.text?.trim();
    if (!text) return existing;

    const idx = existing.findIndex((q) => q.text === text);
    if (idx === -1) {
        const next = [{ ...incoming, text }, ...existing];
        return next.length > MAX_QUERIES_PER_CONVERSATION
            ? next.slice(0, MAX_QUERIES_PER_CONVERSATION)
            : next;
    }

    const current = existing[idx];
    const sources = current.sources?.length
        ? promoteCitedFlags(current.sources, incoming.sources)
        : incoming.sources ?? current.sources;

    const merged: CapturedQuery = {
        ...current,
        sources,
        searchEngine: current.searchEngine ?? incoming.searchEngine,
        turnUseCase: current.turnUseCase ?? incoming.turnUseCase,
        modelSlug: current.modelSlug ?? incoming.modelSlug,
        workingTurnId: current.workingTurnId ?? incoming.workingTurnId,
        conversationId: current.conversationId ?? incoming.conversationId,
    };

    const unchanged =
        merged.sources === current.sources &&
        merged.searchEngine === current.searchEngine &&
        merged.turnUseCase === current.turnUseCase &&
        merged.modelSlug === current.modelSlug &&
        merged.workingTurnId === current.workingTurnId &&
        merged.conversationId === current.conversationId;
    if (unchanged) return existing;

    const next = [...existing];
    next[idx] = merged;
    return next;
}

export function mergeQueries(existing: CapturedQuery[], incoming: CapturedQuery[]): CapturedQuery[] {
    return incoming.reduce(mergeQuery, existing);
}

/**
 * Trims each conversation's query list to `maxQueriesPerConversation`, then
 * drops the oldest conversations (by insertion order) beyond
 * `maxConversations`. Used both by the persistence layer before every write
 * and as a fallback when a write is over the storage byte budget.
 */
export function pruneConversations(
    map: Record<string, CapturedQuery[]>,
    maxConversations: number,
    maxQueriesPerConversation: number,
): Record<string, CapturedQuery[]> {
    const trimmed: Record<string, CapturedQuery[]> = {};
    for (const key of Object.keys(map)) {
        trimmed[key] = map[key].slice(0, maxQueriesPerConversation);
    }

    const keys = Object.keys(trimmed);
    const excess = keys.length - maxConversations;
    if (excess <= 0) return trimmed;

    const pruned = { ...trimmed };
    keys.slice(0, excess).forEach((k) => delete pruned[k]);
    return pruned;
}
