export function MetaTag({ className, label, title }: { className: string; label: string; title: string }) {
    return (
        <span class={className} title={title}>
            {label}
        </span>
    );
}
