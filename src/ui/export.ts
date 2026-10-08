import type { CapturedQuery } from "../core/types";

export const REVEAL_PROMPT =
    "List the exact search queries you just issued via web search for your last answer, one per line, with no extra commentary.";

export function safeHostname(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return url.slice(0, 40);
    }
}

/** A leading =, +, -, or @ is interpreted as a formula by Excel/Sheets when a
 * CSV is opened there (CVE-class "CSV injection") -- prefixed with a quote to
 * neutralize it, same as GitHub and other CSV-exporting tools do. */
const FORMULA_TRIGGER = /^[=+\-@]/;

export function csvCell(value: string): string {
    const safe = FORMULA_TRIGGER.test(value) ? `'${value}` : value;
    const needsQuotes = /[",\n]/.test(safe);
    const escaped = safe.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
}

export function buildCsv(queries: CapturedQuery[]): string {
    const header = "query,platform,search_engine,turn_use_case,model_slug,sources_cited,sources_retrieved,source_urls";
    const lines = queries.map((q) => {
        const cited = (q.sources ?? []).filter((s) => s.cited).length;
        const retrieved = (q.sources ?? []).filter((s) => !s.cited).length;
        const urls = (q.sources ?? []).map((s) => s.url).join(" | ");
        return [
            csvCell(q.text),
            csvCell(q.platform ?? ""),
            csvCell(q.searchEngine ?? ""),
            csvCell(q.turnUseCase ?? ""),
            csvCell(q.modelSlug ?? ""),
            String(cited),
            String(retrieved),
            csvCell(urls),
        ].join(",");
    });
    return [header, ...lines].join("\n");
}

export function buildMarkdown(queries: CapturedQuery[]): string {
    const lines: string[] = ["# AI Search Revealer export", ""];
    queries.forEach((q, i) => {
        const meta = [q.platform, q.searchEngine ? `via ${q.searchEngine}` : "", q.turnUseCase, q.modelSlug]
            .filter(Boolean)
            .join(" · ");
        lines.push(`## ${i + 1}. ${q.text}`);
        if (meta) lines.push(`_${meta}_`);
        const cited = (q.sources ?? []).filter((s) => s.cited);
        const retrieved = (q.sources ?? []).filter((s) => !s.cited);
        if (cited.length > 0) {
            lines.push("", "**Cited:**");
            cited.forEach((s) => lines.push(`- [${s.title || safeHostname(s.url)}](${s.url})`));
        }
        if (retrieved.length > 0) {
            lines.push("", `**Retrieved (${retrieved.length}, not cited):**`);
            retrieved.slice(0, 20).forEach((s) => lines.push(`- [${s.title || safeHostname(s.url)}](${s.url})`));
            if (retrieved.length > 20) lines.push(`- …and ${retrieved.length - 20} more`);
        }
        lines.push("");
    });
    return lines.join("\n");
}

export function download(doc: Document, win: Window, filename: string, mime: string, text: string): boolean {
    try {
        if (!doc.body) return false;
        const blob = new Blob([text], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = doc.createElement("a");
        a.href = url;
        a.download = filename;
        doc.body.appendChild(a);
        a.click();
        a.remove();
        win.setTimeout(() => URL.revokeObjectURL(url), 5000);
        return true;
    } catch {
        return false;
    }
}

export function buildSourceTooltip(source: { title?: string; url: string; snippet?: string; resultSource?: string; pubDate?: string }): string {
    return [source.title || source.url, source.snippet, source.resultSource ? `via ${source.resultSource}` : "", source.pubDate ?? ""]
        .filter(Boolean)
        .join(" — ");
}
