import type { Source } from "../../platforms/types";
import { SourceChip } from "./SourceChip";

interface Props {
    label: string;
    sources: Source[];
    cited: boolean;
    maxVisible?: number;
}

export function SourceChipGroup({ label, sources, cited, maxVisible }: Props) {
    const visible = maxVisible ? sources.slice(0, maxVisible) : sources;
    const overflow = sources.length - visible.length;
    return (
        <div class="csr-sources-group">
            <div class={cited ? "csr-sources-label csr-cited-label" : "csr-sources-label"}>{label}</div>
            <div class="csr-sources-container">
                {visible.map((s) => (
                    <SourceChip key={s.url} source={s} cited={cited} />
                ))}
            </div>
            {overflow > 0 && <div class="csr-more-sources">+{overflow} more retrieved — export CSV for full list</div>}
        </div>
    );
}
