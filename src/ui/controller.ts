import type { InterceptedMessage } from "../platforms/types";

export type CapturedQuery = {
    text: string;
    platform?: string;
    timestamp: number;
    sources?: import("../platforms/types").Source[];
    searchEngine?: string;
};

export interface UiControllerDeps {
    doc: Document;
    win: Window;
    /**
     * Optional hook used by the extension runtime to update the badge.
     * In tests this can be omitted.
     */
    sendBadgeUpdate?: (count: number) => Promise<unknown> | void;
}

export interface UiController {
    render: () => void;
    handleInterceptedMessage: (message: Partial<InterceptedMessage>) => void;
    getState: () => { isCollapsed: boolean; capturedQueries: CapturedQuery[] };
    setEnabled: (enabled: boolean) => void;
    isEnabled: () => boolean;
    destroy: () => void;
}

function safeHostname(url: string): string {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url.slice(0, 40);
    }
}

export function createUiController(deps: UiControllerDeps): UiController {
    let isCollapsed = true;
    let enabled = true;
    const capturedQueries: CapturedQuery[] = [];

    const ensureRoot = (): HTMLDivElement => {
        let container = deps.doc.getElementById("csr-root") as HTMLDivElement | null;
        if (container) return container;

        container = deps.doc.createElement("div");
        container.id = "csr-root";
        container.className = "csr-container csr-fade-in";
        container.setAttribute("data-csr-root", "true");

        // Mount ASAP, even before <body> exists (document_start).
        const mountTarget = deps.doc.body ?? deps.doc.documentElement;
        mountTarget.appendChild(container);

        // If we mounted to <html>, move to <body> once it exists.
        if (!deps.doc.body && typeof MutationObserver !== "undefined") {
            const mo = new MutationObserver(() => {
                if (deps.doc.body && container && container.parentElement !== deps.doc.body) {
                    deps.doc.body.appendChild(container);
                    mo.disconnect();
                }
            });
            mo.observe(deps.doc.documentElement, { childList: true, subtree: true });
        }

        // Allow clicking the collapsed bubble to expand
        container.addEventListener("click", () => {
            if (isCollapsed) {
                isCollapsed = false;
                renderUI();
            }
        });

        // Keyboard support when collapsed
        container.addEventListener("keydown", (e) => {
            if (!isCollapsed) return;
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                isCollapsed = false;
                renderUI();
            }
        });

        return container;
    };

    const renderUI = (): void => {
        // When disabled, remove any visible UI and stop.
        if (!enabled) {
            deps.doc.getElementById("csr-root")?.remove();
            return;
        }
        const container = ensureRoot();

        if (isCollapsed) {
            container.classList.add("collapsed");
            container.setAttribute("role", "button");
            container.setAttribute("tabindex", "0");
            container.setAttribute("aria-label", "Open AI Search Revealer");
            container.innerHTML = "";
            const dot = deps.doc.createElement("div");
            dot.className = "csr-live-dot";
            dot.style.width = "12px";
            dot.style.height = "12px";
            container.appendChild(dot);
            return;
        }

        container.classList.remove("collapsed");
        container.removeAttribute("role");
        container.removeAttribute("tabindex");
        container.removeAttribute("aria-label");

        // Static shell (safe: no untrusted interpolation)
        container.innerHTML = `
            <div class="csr-header">
                <div class="csr-title-group">
                    <div class="csr-title">
                        <div class="csr-live-dot" aria-hidden="true"></div>
                        AI SEARCH REVEALER
                    </div>
                    <a href="https://mimrgrowthlab.com/" target="_blank" rel="noreferrer" class="csr-attribution">by MIMR Growth Lab</a>
                </div>
                <div class="csr-controls">
                    <button type="button" aria-label="Minimize" title="Minimize" class="csr-btn" id="csr-collapse-btn">−</button>
                    <button type="button" aria-label="Close" title="Close" class="csr-btn" id="csr-close-btn">&times;</button>
                </div>
            </div>
            <div class="csr-content">
                <ul class="csr-list" id="csr-query-list"></ul>
            </div>
        `;

        const list = container.querySelector("#csr-query-list") as HTMLUListElement;
        if (capturedQueries.length === 0) {
            const li = deps.doc.createElement("li");
            li.className = "csr-item csr-empty";
            const title = deps.doc.createElement("div");
            title.className = "csr-query-text";
            title.textContent = "No searches captured yet.";
            const hint = deps.doc.createElement("div");
            hint.className = "csr-copy-hint";
            hint.textContent = "Ask a question that triggers web search to see queries here.";
            hint.style.opacity = "0.7";
            li.appendChild(title);
            li.appendChild(hint);
            list.appendChild(li);
        } else {
            capturedQueries.forEach(item => {
                const li = deps.doc.createElement("li");
                li.className = "csr-item";

                const header = deps.doc.createElement("div");
                header.className = "csr-item-header";

                const tag = deps.doc.createElement("span");
                const platformClass = `platform-${(item.platform || "unknown").toLowerCase()}`;
                tag.className = `csr-platform-tag ${platformClass}`;
                tag.textContent = item.platform || "QUERY";

                const meta = deps.doc.createElement("div");
                meta.className = "csr-item-meta";
                meta.appendChild(tag);

                if (item.searchEngine) {
                    const engine = deps.doc.createElement("span");
                    engine.className = "csr-engine-tag";
                    engine.textContent = `via ${item.searchEngine}`;
                    engine.title = `Search backend: ${item.searchEngine}`;
                    meta.appendChild(engine);
                }

                const tools = deps.doc.createElement("div");
                tools.className = "csr-tools";

                const encodedQ = encodeURIComponent(item.text);
                const mkTool = (href: string, title: string, label: string) => {
                    const a = deps.doc.createElement("a");
                    a.className = "csr-tool-link";
                    a.href = href;
                    a.target = "_blank";
                    a.rel = "noreferrer";
                    a.title = title;
                    a.setAttribute("aria-label", title);
                    a.textContent = label;
                    return a;
                };
                tools.appendChild(mkTool(`https://www.google.com/search?q=${encodedQ}`, "Verify on Google", "🔎"));
                tools.appendChild(mkTool(`https://trends.google.com/trends/explore?q=${encodedQ}`, "Trends", "📈"));
                tools.appendChild(mkTool(`https://answerthepublic.com/?q=${encodedQ}`, "Deep Insights", "🧠"));

                header.appendChild(meta);
                header.appendChild(tools);

                const textEl = deps.doc.createElement("div");
                textEl.className = "csr-query-text";
                textEl.textContent = item.text;

                if (item.sources && item.sources.length > 0) {
                    const sourcesContainer = deps.doc.createElement("div");
                    sourcesContainer.className = "csr-sources-container";

                    item.sources.forEach(source => {
                        const chip = deps.doc.createElement("a");
                        chip.className = "csr-source-chip";
                        chip.href = source.url;
                        chip.target = "_blank";
                        chip.rel = "noreferrer";
                        chip.title = source.title || source.url;

                        // Icon via Google favicon service. Privacy note: this sends
                        // the source hostname to google.com/s2/favicons. Disclosed
                        // in PRIVACY_POLICY.md + store Data Safety form.
                        const icon = deps.doc.createElement("img") as HTMLImageElement;
                        icon.className = "csr-source-icon";
                        icon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeHostname(source.url))}&sz=16`;
                        icon.alt = "";
                        icon.setAttribute("loading", "lazy");
                        icon.setAttribute("referrerpolicy", "no-referrer");
                        icon.onerror = () => { icon.style.display = 'none'; }; // Hide broken icons

                        const domain = deps.doc.createElement("span");
                        domain.textContent = safeHostname(source.url);

                        chip.appendChild(icon);
                        chip.appendChild(domain);
                        sourcesContainer.appendChild(chip);
                    });

                    li.appendChild(sourcesContainer);
                }

                const hint = deps.doc.createElement("div");
                hint.className = "csr-copy-hint";
                hint.textContent = "Click text to copy";

                textEl.addEventListener("click", () => {
                    // Clipboard isn’t available in unit tests; ignore failures.
                    deps.win.navigator.clipboard?.writeText(item.text).then(() => {
                        hint.textContent = "COPIED!";
                        hint.style.color = "#10a37f";
                        deps.win.setTimeout(() => {
                            hint.textContent = "Click text to copy";
                            hint.style.color = "";
                        }, 2000);
                    }).catch(() => {
                        hint.textContent = "Copy failed";
                        hint.style.color = "#ef4444";
                    });
                });

                li.appendChild(header);
                li.appendChild(textEl);
                li.appendChild(hint);
                list.appendChild(li);
            });
        }

        container.querySelector<HTMLButtonElement>("#csr-collapse-btn")!.onclick = (e) => {
            e.stopPropagation();
            isCollapsed = true;
            renderUI();
        };

        container.querySelector<HTMLButtonElement>("#csr-close-btn")!.onclick = (e) => {
            e.stopPropagation();
            container?.remove();
        };
    };

    const handleInterceptedMessage = (message: Partial<InterceptedMessage>) => {
        if (!enabled) return;
        // Strict type check: ignore anything that isn't our bridge message.
        if (message.type !== undefined && message.type !== "AI_SEARCH_REVEALER_FOUND") return;
        const newItems: import("../platforms/types").ExtractedQuery[] = [];

        if (Array.isArray(message.results)) {
            newItems.push(...message.results);
        } else if (Array.isArray(message.queries)) {
            // Backwards compat / shim
            newItems.push(...message.queries.map(q => ({ text: q })));
        }

        newItems.forEach(item => {
            if (!capturedQueries.some(q => q.text === item.text)) {
                capturedQueries.unshift({
                    text: item.text,
                    platform: message.platform,
                    timestamp: Date.now(),
                    sources: item.sources,
                    searchEngine: item.searchEngine
                });
            }
        });

        // Auto-expand on first capture so the user sees results.
        if (isCollapsed && capturedQueries.length > 0) isCollapsed = false;

        renderUI();
        deps.sendBadgeUpdate?.(capturedQueries.length);
    };

    return {
        render: renderUI,
        handleInterceptedMessage,
        getState: () => ({ isCollapsed, capturedQueries: [...capturedQueries] }),
        setEnabled: (next: boolean) => {
            enabled = next;
            if (!enabled) {
                deps.doc.getElementById("csr-root")?.remove();
            } else {
                renderUI();
            }
        },
        isEnabled: () => enabled,
        destroy: () => {
            deps.doc.getElementById("csr-root")?.remove();
        },
    };
}

