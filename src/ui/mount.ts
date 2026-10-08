// Full stylesheets inlined at build time (?inline): the shadow root always
// has the complete theme with zero runtime fetches, so the panel can never
// render unstyled (no chrome-extension:// fetch to fail in a stale tab after
// an extension reload).
import TOKENS_CSS from "./tokens.css?inline";
import COMPONENTS_CSS from "./components.css?inline";

/**
 * Minimal inline styling, always applied first. Guarantees the panel is
 * visible and positioned even if the stylesheet imports above somehow fail
 * to apply before first paint.
 */
const CRITICAL_CSS = [
    ".csr-container{position:fixed;top:24px;right:24px;width:360px;z-index:99999;",
    "font-family:ui-sans-serif,system-ui,sans-serif;color:#e6e9ef;",
    "background:#12151c;border:1px solid rgba(255,255,255,.08);",
    "border-radius:10px;overflow:hidden}",
    ".csr-container.collapsed{width:44px;height:44px;border-radius:999px;cursor:pointer;",
    "display:flex;align-items:center;justify-content:center;background:#181c25}",
].join("\n");

export interface ShadowMount {
    host: HTMLDivElement;
    mount: HTMLDivElement;
}

function attachShadowSafe(host: HTMLDivElement): ShadowRoot | null {
    try {
        const h = host as unknown as { attachShadow?: (init: { mode: string }) => ShadowRoot };
        if (typeof h.attachShadow !== "function") return null;
        if (host.shadowRoot) return host.shadowRoot;
        return h.attachShadow({ mode: "open" });
    } catch {
        return null;
    }
}

/**
 * Shadow-DOM isolation. The light-DOM footprint is a single empty host
 * <div> in <body> (invisible to React hydration); every UI node renders
 * inside its shadow root, so page scripts/styles can neither see nor clash
 * with the overlay. Never mounted into <html>/documentElement: inserting a
 * <div> as a child of <html> is invalid HTML and previously broke ChatGPT's
 * React hydration (minified error #418).
 */
export function createMounter(doc: Document): { ensureMount: () => HTMLDivElement | null; dropCache: () => void } {
    let cache: ShadowMount | null = null;

    function ensureMount(): HTMLDivElement | null {
        if (!doc.body) return null;
        if (cache && cache.host.isConnected) return cache.mount;

        let host = doc.getElementById("csr-root") as HTMLDivElement | null;
        if (!host) {
            host = doc.createElement("div");
            host.id = "csr-root";
            host.setAttribute("data-csr-root", "true");
            doc.body.appendChild(host);
        }

        const shadow = attachShadowSafe(host);
        let mount: HTMLDivElement;
        if (shadow) {
            // Host takes no space in page layout; the visible UI lives in the shadow.
            host.style.display = "contents";
            if (!shadow.querySelector("[data-csr-styles]")) {
                const style = doc.createElement("style");
                style.setAttribute("data-csr-styles", "true");
                style.textContent = `${CRITICAL_CSS}\n${TOKENS_CSS}\n${COMPONENTS_CSS}`;
                shadow.appendChild(style);
            }
            // Neutral anchor -- OverlayRoot renders the actual .csr-container
            // div as Preact's own root output, so there's exactly one of them,
            // not an outer DOM one wrapping an inner Preact-rendered one.
            mount = (shadow.querySelector("[data-csr-mount]") as HTMLDivElement | null) ?? (doc.createElement("div") as HTMLDivElement);
            if (!mount.isConnected) {
                mount.setAttribute("data-csr-mount", "true");
                shadow.appendChild(mount);
            }
        } else {
            // Fallback for environments without Shadow DOM: light-DOM mount.
            mount = host;
        }

        cache = { host, mount };
        return mount;
    }

    function dropCache(): void {
        cache = null;
    }

    return { ensureMount, dropCache };
}
