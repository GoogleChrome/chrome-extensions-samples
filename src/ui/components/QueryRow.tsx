import { useState } from "preact/hooks";
import type { CapturedQuery } from "../../core/types";
import { announce } from "../../store/captures";
import { MetaTag } from "./MetaTag";
import { PlatformTag } from "./PlatformTag";
import { SourceChipGroup } from "./SourceChipGroup";
import { ToolLinks } from "./ToolLinks";

type CopyState = "idle" | "copied" | "failed";

export function QueryRow({ item }: { item: CapturedQuery }) {
    const [copyState, setCopyState] = useState<CopyState>("idle");

    const handleCopy = (): void => {
        navigator.clipboard?.writeText(item.text).then(
            () => {
                setCopyState("copied");
                announce("Query copied to clipboard");
                setTimeout(() => setCopyState("idle"), 2000);
            },
            () => {
                setCopyState("failed");
                announce("Copy failed");
                setTimeout(() => setCopyState("idle"), 2000);
            }
        );
    };

    const cited = (item.sources ?? []).filter((s) => s.cited);
    const retrieved = (item.sources ?? []).filter((s) => !s.cited);

    const hint =
        copyState === "copied" ? "COPIED!" : copyState === "failed" ? "Copy failed" : "Click text to copy";
    const hintStyle =
        copyState === "copied"
            ? { color: "var(--csr-success)" }
            : copyState === "failed"
              ? { color: "var(--csr-danger)" }
              : undefined;

    return (
        <li class="csr-item">
            <div class="csr-item-header">
                <div class="csr-item-meta">
                    <PlatformTag platform={item.platform} />
                    {item.searchEngine && (
                        <MetaTag className="csr-engine-tag" label={`via ${item.searchEngine}`} title={`Search backend: ${item.searchEngine}`} />
                    )}
                    {item.turnUseCase && (
                        <MetaTag className="csr-usecase-tag" label={item.turnUseCase} title={`ChatGPT intent: ${item.turnUseCase}`} />
                    )}
                    {item.modelSlug && <MetaTag className="csr-model-tag" label={item.modelSlug} title={`Model: ${item.modelSlug}`} />}
                </div>
                <ToolLinks query={item.text} />
            </div>

            <button type="button" class="csr-query-text" aria-label="Copy query text" onClick={handleCopy}>
                {item.text}
            </button>

            {cited.length > 0 && <SourceChipGroup label="★ Cited" sources={cited} cited />}
            {retrieved.length > 0 && (
                <SourceChipGroup label={`Retrieved (${retrieved.length})`} sources={retrieved} cited={false} maxVisible={12} />
            )}

            <div class="csr-copy-hint" style={hintStyle}>
                {hint}
            </div>
        </li>
    );
}
