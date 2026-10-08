export function Header({ onMinimize, onClose }: { onMinimize: () => void; onClose: () => void }) {
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
            <div class="csr-controls">
                <button type="button" class="csr-btn" aria-label="Minimize" title="Minimize" onClick={onMinimize}>
                    −
                </button>
                <button type="button" class="csr-btn" aria-label="Close" title="Close" onClick={onClose}>
                    &times;
                </button>
            </div>
        </div>
    );
}
