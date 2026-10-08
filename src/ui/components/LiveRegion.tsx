import { announcement } from "../../store/captures";

/** Permanently mounted, never conditionally unmounted, so screen readers keep
 * a stable live region to announce into (new captures, export/copy results,
 * errors) -- silent for assistive tech in the original. */
export function LiveRegion() {
    return (
        <div class="csr-sr-only" aria-live="polite" aria-atomic="true">
            {announcement.value}
        </div>
    );
}
