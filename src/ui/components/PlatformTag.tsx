export function PlatformTag({ platform }: { platform?: string }) {
    const p = (platform ?? "unknown").toLowerCase();
    return <span class={`csr-platform-tag platform-${p}`}>{platform || "QUERY"}</span>;
}
