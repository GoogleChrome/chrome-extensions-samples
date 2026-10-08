import { computed, signal } from "@preact/signals";
import { mergeQueries, mergeQuery } from "../core/merge";
import type { CapturedQuery } from "../core/types";

export const capturedQueries = signal<CapturedQuery[]>([]);
export const isCollapsed = signal(true);
export const isEnabled = signal(true);
export const isRestoring = signal(false);

export const platformFilter = signal("all");
export const useCaseFilter = signal("all");
export const textFilter = signal("");

export const networkStats = signal<{ seen: number; matched: number } | null>(null);
export const lastError = signal<{ message: string; tone: "warning" | "error" } | null>(null);
/** Drives the ARIA live region. A monotonic id is appended so repeating the
 * same message text still produces a DOM change for screen readers to announce. */
export const announcement = signal("");
let announcementSeq = 0;

export const queryCount = computed(() => capturedQueries.value.length);

export const filteredQueries = computed(() => {
    const platform = platformFilter.value;
    const useCase = useCaseFilter.value;
    const needle = textFilter.value.trim().toLowerCase();
    return capturedQueries.value.filter((q) => {
        if (platform !== "all" && (q.platform ?? "unknown") !== platform) return false;
        if (useCase !== "all" && (q.turnUseCase ?? "unknown") !== useCase) return false;
        if (needle && !q.text.toLowerCase().includes(needle)) return false;
        return true;
    });
});

export function announce(message: string): void {
    announcementSeq += 1;
    announcement.value = `${message}​${"​".repeat(announcementSeq % 2)}`;
}

export function addQuery(item: CapturedQuery): boolean {
    const before = capturedQueries.value;
    const next = mergeQuery(before, item);
    capturedQueries.value = next;
    return next !== before;
}

export function importQueries(items: CapturedQuery[]): boolean {
    if (items.length === 0) return false;
    const before = capturedQueries.value;
    const next = mergeQueries(before, items);
    capturedQueries.value = next;
    return next !== before;
}

export function replaceAll(items: CapturedQuery[]): void {
    capturedQueries.value = items;
}

export function resetFilters(): void {
    platformFilter.value = "all";
    useCaseFilter.value = "all";
    textFilter.value = "";
}
