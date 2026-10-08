export function Bubble({ count }: { count: number }) {
    return (
        <>
            <div class="csr-live-dot" aria-hidden="true" />
            {count > 0 && <div class="csr-bubble-count">{count}</div>}
        </>
    );
}
