import type { ExtractedQuery } from "../platforms/types";

/** A captured query enriched with the context it was captured in. */
export interface CapturedQuery extends ExtractedQuery {
    platform?: string;
    timestamp: number;
    conversationId?: string;
}

export const SCHEMA_VERSION = 1 as const;

export const MAX_CONVERSATIONS = 20;
export const MAX_QUERIES_PER_CONVERSATION = 100;

export interface PersistedSchemaV1 {
    schemaVersion: typeof SCHEMA_VERSION;
    /** Keyed by conversation key (e.g. "chatgpt:<uuid>" or "<host><path>"). */
    conversations: Record<string, CapturedQuery[]>;
}
