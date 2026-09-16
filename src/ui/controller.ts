import type { InterceptedMessage } from "../platforms/types";

export const REVEAL_PROMPT =
    "List the exact search queries you just issued via web search for your last answer, one per line, with no extra commentary.";

export type CapturedQuery = {
    text: string;
    platform?: string;
    timestamp: number;
    sources?: import("../platforms/types").Source[];
    searchEngine?: string;
    turnUseCase?: string;
    modelSlug?: string;
    workingTurnId?: string;
    conversationId?: string;
};

export interface UiControllerDeps {
    doc: Document;
    win: Window;
    /**
     * Optional hook used by the extension runtime to update the badge.
     * In tests this can be omitted.
     */
    sendBadgeUpdate?: (count: number) => Promise<unknown> | void;
    /** Seed restored from chrome.storage (survives refresh). */
    initialQueries?: CapturedQuery[];
    /** Called whenever the query list changes so the host can persist it. */
    onQueriesChanged?: (queries: CapturedQuery[]) => void;
}

export interface UiController {
    render: () => void;
    handleInterceptedMessage: (message: Partial<InterceptedMessage>) => void;
    importQueries: (items: CapturedQuery[]) => void;
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

function csvCell(value: string): string {
    const needsQuotes = /[",\n]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
}

export function buildCsv(queries: CapturedQuery[]): string {
    const header = "query,platform,search_engine,turn_use_case,model_slug,sources_cited,sources_retrieved,source_urls";
    const lines = queries.map((q) => {
        const cited = (q.sources ?? []).filter((s) => s.cited).length;
        const retrieved = (q.sources ?? []).filter((s) => !s.cited).length;
        const urls = (q.sources ?? []).map((s) => s.url).join(" | ");
        return [
            csvCell(q.text),
            csvCell(q.platform ?? ""),
            csvCell(q.searchEngine ?? ""),
            csvCell(q.turnUseCase ?? ""),
            csvCell(q.modelSlug ?? ""),
            String(cited),
            String(retrieved),
            csvCell(urls),
        ].join(",");
    });
    return [header, ...lines].join("\n");
}

export function buildMarkdown(queries: CapturedQuery[]): string {
    const lines: string[] = ["# AI Search Revealer export", ""];
    queries.forEach((q, i) => {
        const meta = [q.platform, q.searchEngine ? `via ${q.searchEngine}` : "", q.turnUseCase, q.modelSlug].filter(Boolean).join(" · ");
        lines.push(`## ${i + 1}. ${q.text}`);
        if (meta) lines.push(`_${meta}_`);
        const cited = (q.sources ?? []).filter((s) => s.cited);
        const retrieved = (q.sources ?? []).filter((s) => !s.cited);
        if (cited.length > 0) {
            lines.push("", "**Cited:**");
            cited.forEach((s) => lines.push(`- [${s.title || safeHostname(s.url)}](${s.url})`));
        }
        if (retrieved.length > 0) {
            lines.push("", `**Retrieved (${retrieved.length}, not cited):**`);
            retrieved.slice(0, 20).forEach((s) => lines.push(`- [${s.title || safeHostname(s.url)}](${s.url})`));
            if (retrieved.length > 20) lines.push(`- …and ${retrieved.length - 20} more`);
        }
        lines.push("");
    });
    return lines.join("\n");
}

export function createUiController(deps: UiControllerDeps): UiController {
    let isCollapsed = true;
    let enabled = true;
    let platformFilter = "all";
    let useCaseFilter = "all";
    let textFilter = "";
    const capturedQueries: CapturedQuery[] = [...(deps.initialQueries ?? [])];
    if (capturedQueries.length > 0) isCollapsed = false;

    const notifyChanged = (): void => {
        try {
            deps.onQueriesChanged?.([...capturedQueries]);
        } catch {
            // Host persistence is best-effort.
        }
    };

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

    const download = (filename: string, mime: string, text: string): boolean => {
        try {
            const blob = new Blob([text], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = deps.doc.createElement("a") as HTMLAnchorElement;
            a.href = url;
            a.download = filename;
            (deps.doc.body ?? deps.doc.documentElement).appendChild(a);
            a.click();
            a.remove();
            deps.win.setTimeout(() => URL.revokeObjectURL(url), 5000);
            return true;
        } catch {
            return false;
        }
    };

    const filteredQueries = (): CapturedQuery[] => {
        const needle = textFilter.trim().toLowerCase();
        return capturedQueries.filter((q) => {
            if (platformFilter !== "all" && (q.platform ?? "unknown") !== platformFilter) return false;
            if (useCaseFilter !== "all" && (q.turnUseCase ?? "unknown") !== useCaseFilter) return false;
            if (needle && !q.text.toLowerCase().includes(needle)) return false;
            return true;
        });
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
            // Show count badge on the bubble when collapsed.
            if (capturedQueries.length > 0) {
                const badge = deps.doc.createElement("div");
                badge.className = "csr-bubble-count";
                badge.textContent = String(capturedQueries.length);
                container.appendChild(badge);
            }
            return;
        }

        container.classList.remove("collapsed");
        container.removeAttribute("role");
        container.removeAttribute("tabindex");
        container.removeAttribute("aria-label");

        const platforms = Array.from(new Set(capturedQueries.map((q) => q.platform ?? "unknown")));
        const useCases = Array.from(new Set(capturedQueries.map((q) => q.turnUseCase ?? "unknown").filter((u) => u !== "unknown")));
        const totalCited = capturedQueries.reduce((n, q) => n + (q.sources ?? []).filter((s) => s.cited).length, 0);
        const totalRetrieved = capturedQueries.reduce((n, q) => n + (q.sources ?? []).filter((s) => !s.cited).length, 0);

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
            <div class="csr-toolbar">
                <div class="csr-filters">
                    <select class="csr-select" id="csr-platform-filter" title="Filter by platform"></select>
                    <select class="csr-select" id="csr-usecase-filter" title="Filter by intent"></select>
                    <input class="csr-search" id="csr-text-filter" type="search" placeholder="Filter queries…" autocomplete="off" />
                </div>
                <div class="csr-exports">
                    <button type="button" class="csr-export-btn" id="csr-export-csv" title="Download queries + sources as CSV">CSV</button>
                    <button type="button" class="csr-export-btn" id="csr-export-md" title="Download queries + sources as Markdown">MD</button>
                    <button type="button" class="csr-export-btn csr-ask-btn" id="csr-ask-btn" title="Copy a prompt that asks the model to list its own search queries">Ask AI</button>
                </div>
                <div class="csr-stats" id="csr-stats"></div>
            </div>
            <div class="csr-content">
                <ul class="csr-list" id="csr-query-list"></ul>
            </div>
        `;

        const platformSelect = container.querySelector("#csr-platform-filter") as HTMLSelectElement;
        const useCaseSelect = container.querySelector("#csr-usecase-filter") as HTMLSelectElement;
        const textInput = container.querySelector("#csr-text-filter") as HTMLInputElement;
        const stats = container.querySelector("#csr-stats") as HTMLDivElement;

        const mkOption = (value: string, label: string, selected: string): HTMLOptionElement => {
            const o = deps.doc.createElement("option") as HTMLOptionElement;
            o.value = value;
            o.textContent = label;
            if (value === selected) o.selected = true;
            return o;
        };
        platformSelect.appendChild(mkOption("all", `All platforms (${capturedQueries.length})`, platformFilter));
        platforms.forEach((p) => {
            const n = capturedQueries.filter((q) => (q.platform ?? "unknown") === p).length;
            platformSelect.appendChild(mkOption(p, `${p} (${n})`, platformFilter));
        });
        useCaseSelect.appendChild(mkOption("all", "All intents", useCaseFilter));
        useCases.forEach((u) => useCaseSelect.appendChild(mkOption(u, u, useCaseFilter)));
        if (useCases.length === 0) {
            const o = deps.doc.createElement("option") as HTMLOptionElement;
            o.value = "all";
            o.textContent = "No intents yet";
            o.disabled = true;
            useCaseSelect.appendChild(o);
        }
        textInput.value = textFilter;
        stats.textContent = `${capturedQueries.length} queries · ★ ${totalCited} cited · ${totalRetrieved} retrieved`;

        platformSelect.onchange = () => { platformFilter = platformSelect.value; renderUI(); };
        useCaseSelect.onchange = () => { useCaseFilter = useCaseSelect.value; renderUI(); };
        textInput.oninput = () => { textFilter = textInput.value; renderList(); };
        // Don't let typing in the filter collapse/expand the panel.
        textInput.onclick = (e) => e.stopPropagation();
        platformSelect.onclick = (e) => e.stopPropagation();
        useCaseSelect.onclick = (e) => e.stopPropagation();

        const flashStats = (msg: string): void => {
            stats.textContent = msg;
            deps.win.setTimeout(() => {
                const el = deps.doc.getElementById("csr-stats");
                if (el) el.textContent = `${capturedQueries.length} queries · ★ ${totalCited} cited · ${totalRetrieved} retrieved`;
            }, 2500);
        };

        (container.querySelector("#csr-export-csv") as HTMLButtonElement).onclick = (e) => {
            e.stopPropagation();
            const ok = download("ai-search-revealer.csv", "text/csv", buildCsv(filteredQueries()));
            flashStats(ok ? "CSV downloaded" : "Download blocked by page");
        };
        (container.querySelector("#csr-export-md") as HTMLButtonElement).onclick = (e) => {
            e.stopPropagation();
            const ok = download("ai-search-revealer.md", "text/markdown", buildMarkdown(filteredQueries()));
            flashStats(ok ? "Markdown downloaded" : "Download blocked by page");
        };
        (container.querySelector("#csr-ask-btn") as HTMLButtonElement).onclick = (e) => {
            e.stopPropagation();
            deps.win.navigator.clipboard?.writeText(REVEAL_PROMPT).then(() => {
                flashStats("Reveal prompt copied — paste it into the chat");
            }).catch(() => {
                flashStats("Copy failed — select manually");
            });
        };

        const renderList = (): void => {
            const list = container.querySelector("#csr-query-list") as HTMLUListElement;
            list.innerHTML = "";
            const rows = filteredQueries();
            if (rows.length === 0) {
                const li = deps.doc.createElement("li");
                li.className = "csr-item csr-empty";
                const title = deps.doc.createElement("div");
                title.className = "csr-query-text";
                title.textContent = capturedQueries.length === 0 ? "No searches captured yet." : "No queries match these filters.";
                const hint = deps.doc.createElement("div");
                hint.className = "csr-copy-hint";
                hint.textContent = "Ask a question that triggers web search to see queries here.";
                hint.style.opacity = "0.7";
                li.appendChild(title);
                li.appendChild(hint);
                list.appendChild(li);
                return;
            }
            rows.forEach((item) => list.appendChild(renderItem(item)));
        };

        const renderItem = (item: CapturedQuery): HTMLLIElement => {
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
            if (item.turnUseCase) {
                const uc = deps.doc.createElement("span");
                uc.className = "csr-usecase-tag";
                uc.textContent = item.turnUseCase;
                uc.title = `ChatGPT intent: ${item.turnUseCase}`;
                meta.appendChild(uc);
            }
            if (item.modelSlug) {
                const ms = deps.doc.createElement("span");
                ms.className = "csr-model-tag";
                ms.textContent = item.modelSlug;
                ms.title = `Model: ${item.modelSlug}`;
                meta.appendChild(ms);
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

            li.appendChild(header);
            li.appendChild(textEl);

            const cited = (item.sources ?? []).filter((s) => s.cited);
            const retrieved = (item.sources ?? []).filter((s) => !s.cited);
            if (cited.length > 0) li.appendChild(renderSourceGroup("★ Cited", cited, true));
            if (retrieved.length > 0) li.appendChild(renderSourceGroup(`Retrieved (${retrieved.length})`, retrieved.slice(0, 12), false));
            if ((item.sources ?? []).length > cited.length + Math.min(retrieved.length, 12)) {
                const more = deps.doc.createElement("div");
                more.className = "csr-more-sources";
                more.textContent = `+${(item.sources ?? []).length - cited.length - Math.min(retrieved.length, 12)} more retrieved — export CSV for full list`;
                li.appendChild(more);
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

            li.appendChild(hint);
            return li;
        };

        const renderSourceGroup = (label: string, group: import("../platforms/types").Source[], isCited: boolean): HTMLDivElement => {
            const wrap = deps.doc.createElement("div");
            wrap.className = "csr-sources-group";
            const heading = deps.doc.createElement("div");
            heading.className = isCited ? "csr-sources-label csr-cited-label" : "csr-sources-label";
            heading.textContent = label;
            wrap.appendChild(heading);
            const sourcesContainer = deps.doc.createElement("div");
            sourcesContainer.className = "csr-sources-container";

            group.forEach((source) => {
                const chip = deps.doc.createElement("a");
                chip.className = isCited ? "csr-source-chip csr-source-cited" : "csr-source-chip";
                chip.href = source.url;
                chip.target = "_blank";
                chip.rel = "noreferrer";
                const tip = [source.title || source.url, source.snippet, source.resultSource ? `via ${source.resultSource}` : "", source.pubDate ?? ""].filter(Boolean).join(" — ");
                chip.title = tip || source.url;

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

            wrap.appendChild(sourcesContainer);
            return wrap;
        };

        const renderListInitial = (): void => renderList();
        renderListInitial();

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

    const mergeItems = (items: { text: string; platform?: string; sources?: import("../platforms/types").Source[]; searchEngine?: string; turnUseCase?: string; modelSlug?: string; workingTurnId?: string; conversationId?: string }[], sourcePlatform?: string): boolean => {
        let added = false;
        items.forEach((item) => {
            if (!item.text || typeof item.text !== "string") return;
            const text = item.text.trim();
            if (!text) return;
            if (!capturedQueries.some((q) => q.text === text)) {
                capturedQueries.unshift({
                    text,
                    platform: item.platform ?? sourcePlatform,
                    timestamp: Date.now(),
                    sources: item.sources,
                    searchEngine: item.searchEngine,
                    turnUseCase: item.turnUseCase,
                    modelSlug: item.modelSlug,
                    workingTurnId: item.workingTurnId,
                    conversationId: item.conversationId,
                });
                if (capturedQueries.length > 100) capturedQueries.pop();
                added = true;
            } else {
                // Upgrade existing row with richer metadata when backfill arrives later.
                const existing = capturedQueries.find((q) => q.text === text);
                if (existing) {
                    if (item.sources?.length && !(existing.sources?.length)) existing.sources = item.sources;
                    if (item.turnUseCase && !existing.turnUseCase) existing.turnUseCase = item.turnUseCase;
                    if (item.modelSlug && !existing.modelSlug) existing.modelSlug = item.modelSlug;
                    if (item.searchEngine && !existing.searchEngine) existing.searchEngine = item.searchEngine;
                    if (item.workingTurnId && !existing.workingTurnId) existing.workingTurnId = item.workingTurnId;
                    // Promote cited flags from backfill.
                    (item.sources ?? []).forEach((s) => {
                        const match = existing.sources?.find((e) => e.url === s.url);
                        if (match && s.cited) match.cited = true;
                    });
                }
            }
        });
        return added;
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

        const withConversation = newItems.map((r) => ({ ...r, conversationId: message.conversationId }));
        mergeItems(withConversation, message.platform);

        // Auto-expand on first capture so the user sees results.
        if (isCollapsed && capturedQueries.length > 0) isCollapsed = false;

        renderUI();
        notifyChanged();
        deps.sendBadgeUpdate?.(capturedQueries.length);
    };

    return {
        render: renderUI,
        handleInterceptedMessage,
        importQueries: (items) => {
            if (!enabled || items.length === 0) return;
            mergeItems(items);
            if (isCollapsed && capturedQueries.length > 0) isCollapsed = false;
            renderUI();
            notifyChanged();
            deps.sendBadgeUpdate?.(capturedQueries.length);
        },
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
