import { capturedQueries, networkStats } from "../../store/captures";

export function StatsLine() {
    const queries = capturedQueries.value;
    const cited = queries.reduce((n, q) => n + (q.sources ?? []).filter((s) => s.cited).length, 0);
    const retrieved = queries.reduce((n, q) => n + (q.sources ?? []).filter((s) => !s.cited).length, 0);
    const stats = networkStats.value;
    const net = stats && stats.seen > 0 ? ` · net ${stats.seen} seen/${stats.matched} hit` : "";

    return (
        <div class="csr-stats">
            {queries.length} queries · ★ {cited} cited · {retrieved} retrieved
            {net}
        </div>
    );
}
