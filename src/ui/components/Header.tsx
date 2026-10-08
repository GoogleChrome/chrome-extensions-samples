import { useEffect, useState } from "preact/hooks";
import { announce, capturedQueries, replaceAll } from "../../store/captures";

const CONFIRM_AUTO_CANCEL_MS = 6000;

export function Header({ onMinimize, onClose }: { onMinimize: () => void; onClose: () => void }) {
    // In-panel confirm, not window.confirm(): a native dialog blocks the
    // whole tab's main thread at the browser-chrome level until a human
    // clicks it, which no automated check (or distracted user) can recover
    // from -- too close to the class of bug that caused a prior uninstall
    // (an overlay freezing/covering the host page). Found live 2026-10-08.
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!confirming) return;
        const timer = window.setTimeout(() => setConfirming(false), CONFIRM_AUTO_CANCEL_MS);
        return () => window.clearTimeout(timer);
    }, [confirming]);

    const handleClearClick = (): void => {
        if (capturedQueries.value.length === 0) return;
        setConfirming(true);
    };

    const handleConfirm = (): void => {
        replaceAll([]);
        announce("All captured queries cleared");
        setConfirming(false);
    };

    return (
        <div class="csr-header">
            <div class="csr-title-group">
                <div class="csr-title">
                    <div class="csr-live-dot" aria-hidden="true" />
                    AI Search Revealer
                </div>
                <a href="https://mimrgrowthlab.com/" target="_blank" rel="noreferrer" class="csr-attribution">
                    by MIMR Growth Lab
                </a>
            </div>
            {confirming ? (
                <div class="csr-clear-confirm">
                    <span>Clear all?</span>
                    <button type="button" class="csr-clear-confirm-yes" onClick={handleConfirm}>
                        Yes
                    </button>
                    <button type="button" class="csr-clear-confirm-no" onClick={() => setConfirming(false)}>
                        No
                    </button>
                </div>
            ) : (
                <div class="csr-controls">
                    <button type="button" class="csr-btn" aria-label="Clear all captured queries" title="Clear all" onClick={handleClearClick}>
                        🗑
                    </button>
                    <button type="button" class="csr-btn" aria-label="Minimize" title="Minimize" onClick={onMinimize}>
                        −
                    </button>
                    <button type="button" class="csr-btn" aria-label="Close" title="Close" onClick={onClose}>
                        &times;
                    </button>
                </div>
            )}
        </div>
    );
}
