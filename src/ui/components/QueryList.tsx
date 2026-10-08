import { filteredQueries, isRestoring, platformFilter, textFilter, useCaseFilter } from "../../store/captures";
import { EmptyState } from "./EmptyState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { QueryRow } from "./QueryRow";

export function QueryList() {
    if (isRestoring.value) return <LoadingSkeleton />;

    const rows = filteredQueries.value;
    if (rows.length === 0) {
        const hasActiveFilters =
            platformFilter.value !== "all" || useCaseFilter.value !== "all" || textFilter.value.trim() !== "";
        return <EmptyState hasActiveFilters={hasActiveFilters} />;
    }

    return (
        <ul class="csr-list">
            {rows.map((item) => (
                <QueryRow key={item.text} item={item} />
            ))}
        </ul>
    );
}
