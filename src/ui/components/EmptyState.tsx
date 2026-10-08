import { resetFilters } from "../../store/captures";

export function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
    return (
        <div class="csr-empty">
            <svg
                class="csr-empty-icon"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
            >
                <circle cx="10" cy="10" r="6" stroke-dasharray="2 2" />
                <line x1="14.5" y1="14.5" x2="20" y2="20" />
            </svg>
            <div class="csr-empty-title">
                {hasActiveFilters ? "No queries match these filters" : "No searches captured yet"}
            </div>
            {hasActiveFilters ? (
                <button type="button" class="csr-clear-filters" onClick={resetFilters}>
                    Clear filters
                </button>
            ) : (
                <div class="csr-empty-subtitle">Ask a question that triggers web search to see queries here.</div>
            )}
        </div>
    );
}
