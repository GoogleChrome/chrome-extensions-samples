import { isCollapsed, isEnabled, queryCount } from "../../store/captures";
import { Bubble } from "./Bubble";
import { LiveRegion } from "./LiveRegion";
import { Panel } from "./Panel";

export function OverlayRoot({ doc, win }: { doc: Document; win: Window }) {
    if (!isEnabled.value) return null;

    const collapsed = isCollapsed.value;
    const count = queryCount.value;
    const expand = (): void => {
        isCollapsed.value = false;
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
        if (!collapsed) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            expand();
        }
    };

    return (
        <>
            <LiveRegion />
            <div
                class={collapsed ? "csr-container collapsed csr-fade-in" : "csr-container csr-fade-in"}
                role={collapsed ? "button" : undefined}
                tabIndex={collapsed ? 0 : undefined}
                aria-label={
                    collapsed ? `Open AI Search Revealer, ${count} ${count === 1 ? "query" : "queries"} captured` : undefined
                }
                onClick={collapsed ? expand : undefined}
                onKeyDown={collapsed ? handleKeyDown : undefined}
            >
                {collapsed ? (
                    <Bubble count={count} />
                ) : (
                    <Panel
                        doc={doc}
                        win={win}
                        onMinimize={() => {
                            isCollapsed.value = true;
                        }}
                        onClose={() => {
                            isEnabled.value = false;
                        }}
                    />
                )}
            </div>
        </>
    );
}
