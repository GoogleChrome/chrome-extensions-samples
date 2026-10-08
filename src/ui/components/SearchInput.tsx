import { textFilter } from "../../store/captures";

export function SearchInput() {
    return (
        <input
            class="csr-search"
            type="search"
            placeholder="Filter queries…"
            autocomplete="off"
            aria-label="Filter queries by text"
            value={textFilter.value}
            onInput={(e) => {
                textFilter.value = (e.currentTarget as HTMLInputElement).value;
            }}
        />
    );
}
