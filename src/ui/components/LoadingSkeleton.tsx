/** Flat placeholder rows, no shimmer -- shimmer reads as "AI magic loading,"
 * exactly the vibe this redesign removes. Gated by the caller on isRestoring
 * only after a short delay, since capture is push-based and the common case
 * (storage restore resolving fast) should never flash this. */
export function LoadingSkeleton() {
    return (
        <>
            <div class="csr-skeleton-row" />
            <div class="csr-skeleton-row" />
        </>
    );
}
