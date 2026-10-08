import type { Signal } from "@preact/signals";

export interface FilterOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export function FilterSelect({ value, options, ariaLabel }: { value: Signal<string>; options: FilterOption[]; ariaLabel: string }) {
    return (
        <select
            class="csr-select"
            aria-label={ariaLabel}
            value={value.value}
            onChange={(e) => {
                value.value = (e.currentTarget as HTMLSelectElement).value;
            }}
        >
            {options.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}
