import type { Source } from "../../platforms/types";
import { buildSourceTooltip, safeHostname } from "../export";

export function SourceChip({ source, cited }: { source: Source; cited: boolean }) {
    return (
        <a
            class={cited ? "csr-source-chip csr-source-cited" : "csr-source-chip"}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            title={buildSourceTooltip(source)}
        >
            <img
                class="csr-source-icon"
                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeHostname(source.url))}&sz=16`}
                alt=""
                loading="lazy"
                referrerpolicy="no-referrer"
                onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
            />
            <span>{safeHostname(source.url)}</span>
        </a>
    );
}
