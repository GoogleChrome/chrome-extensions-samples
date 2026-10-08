import { lastError } from "../../store/captures";

export function ErrorBanner() {
    const err = lastError.value;
    if (!err) return null;
    return (
        <div class={`csr-error-banner tone-${err.tone}`} role="alert">
            <span>{err.message}</span>
            <button
                type="button"
                class="csr-error-dismiss"
                aria-label="Dismiss"
                onClick={() => {
                    lastError.value = null;
                }}
            >
                &times;
            </button>
        </div>
    );
}
