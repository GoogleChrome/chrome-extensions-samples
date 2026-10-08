import { capturedQueries, platformFilter, useCaseFilter } from "../../store/captures";
import { ExportMenu } from "./ExportMenu";
import { FilterSelect, type FilterOption } from "./FilterSelect";
import { SearchInput } from "./SearchInput";
import { StatsLine } from "./StatsLine";

export function Toolbar({ doc, win }: { doc: Document; win: Window }) {
    const queries = capturedQueries.value;
    const platforms = Array.from(new Set(queries.map((q) => q.platform ?? "unknown")));
    const useCases = Array.from(new Set(queries.map((q) => q.turnUseCase ?? "unknown").filter((u) => u !== "unknown")));

    const platformOptions: FilterOption[] = [
        { value: "all", label: `All platforms (${queries.length})` },
        ...platforms.map((p) => ({
            value: p,
            label: `${p} (${queries.filter((q) => (q.platform ?? "unknown") === p).length})`,
        })),
    ];
    const useCaseOptions: FilterOption[] =
        useCases.length > 0
            ? [{ value: "all", label: "All intents" }, ...useCases.map((u) => ({ value: u, label: u }))]
            : [{ value: "all", label: "No intents yet", disabled: true }];

    return (
        <div class="csr-toolbar">
            <div class="csr-filters">
                <FilterSelect value={platformFilter} options={platformOptions} ariaLabel="Filter by platform" />
                <FilterSelect value={useCaseFilter} options={useCaseOptions} ariaLabel="Filter by intent" />
            </div>
            <SearchInput />
            <ExportMenu doc={doc} win={win} />
            <StatsLine />
        </div>
    );
}
