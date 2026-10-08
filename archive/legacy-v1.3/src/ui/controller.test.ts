import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createUiController } from "./controller";

describe("UiController", () => {
    let mockDoc: Document;
    let mockWin: Window;
    let mockContainer: HTMLDivElement;

    beforeEach(() => {
        mockContainer = document.createElement("div");
        mockContainer.id = "csr-root";
        // Attach to the document like the real extension does (appended to
        // <body>), so host.isConnected guards behave as in production.
        document.body.appendChild(mockContainer);

        mockDoc = {
            getElementById: vi.fn(),
            createElement: vi.fn((tag) => document.createElement(tag)),
            body: {
                appendChild: vi.fn(),
            },
        } as unknown as Document;

        (mockDoc.getElementById as any).mockReturnValue(mockContainer);

        mockWin = {
            navigator: {
                clipboard: {
                    writeText: vi.fn().mockResolvedValue(undefined),
                },
            },
            setTimeout: vi.fn((cb) => cb()),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            postMessage: vi.fn(),
        } as unknown as Window;
    });

    afterEach(() => {
        mockContainer.remove();
    });

    // UI renders inside the shadow root; pierce it for assertions.
    const uiQuery = (sel: string): Element | null => {
        const root = (mockContainer.shadowRoot ?? mockContainer) as unknown as Element;
        return root.querySelector(sel);
    };

    it("should render captured queries with sources", () => {
        const controller = createUiController({ doc: mockDoc, win: mockWin });

        controller.handleInterceptedMessage({
            type: "AI_SEARCH_REVEALER_FOUND",
            results: [
                {
                    text: "test query with sources",
                    sources: [
                        { url: "https://example.com", title: "Source 1" }
                    ]
                }
            ],
            platform: "Perplexity"
        });

        const list = uiQuery("#csr-query-list");
        expect(list).not.toBeNull();

        // Check for sources container (should FAIL initially)
        const sourcesContainer = uiQuery(".csr-sources-container");
        expect(sourcesContainer).not.toBeNull();
        expect(sourcesContainer?.textContent).toContain("example.com");
    });

    it("should render the search engine tag when provided", () => {
        const controller = createUiController({ doc: mockDoc, win: mockWin });

        controller.handleInterceptedMessage({
            type: "AI_SEARCH_REVEALER_FOUND",
            results: [{ text: "engine query", searchEngine: "serpapi" }],
            platform: "ChatGPT"
        });

        const engineTag = uiQuery(".csr-engine-tag");
        expect(engineTag).not.toBeNull();
        expect(engineTag?.textContent).toContain("serpapi");
    });

    it("should omit the search engine tag when absent", () => {
        const controller = createUiController({ doc: mockDoc, win: mockWin });

        controller.handleInterceptedMessage({
            type: "AI_SEARCH_REVEALER_FOUND",
            results: [{ text: "plain query" }],
            platform: "ChatGPT"
        });

        expect(uiQuery(".csr-engine-tag")).toBeNull();
    });

    it("should render UI inside a shadow root, keeping light DOM to one empty host", () => {
        const controller = createUiController({ doc: mockDoc, win: mockWin });
        controller.handleInterceptedMessage({
            type: "AI_SEARCH_REVEALER_FOUND",
            results: [{ text: "shadow query" }],
            platform: "ChatGPT"
        });

        expect(mockContainer.shadowRoot).not.toBeNull();
        expect(uiQuery("#csr-query-list")).not.toBeNull();
        // Host itself stays empty: no light-DOM nodes for React to trip over.
        expect(mockContainer.childNodes.length).toBe(0);
    });

    it("should inline critical + full CSS so the panel is styled with zero runtime fetches", () => {
        const controller = createUiController({ doc: mockDoc, win: mockWin });
        controller.render();

        const style = (mockContainer.shadowRoot as unknown as Element | null)?.querySelector(
            "style[data-csr-styles]"
        );
        expect(style).not.toBeNull();
        // Critical base is always present (vitest nullifies CSS imports, so the
        // full inlined theme is verified in the production bundle instead).
        expect(style?.textContent).toContain(".csr-container{position:fixed");
    });

    it("should surface interceptor network stats without re-rendering filters", () => {
        const controller = createUiController({ doc: mockDoc, win: mockWin });
        controller.handleInterceptedMessage({
            type: "AI_SEARCH_REVEALER_FOUND",
            results: [{ text: "stats query" }],
            platform: "ChatGPT"
        });

        controller.setNetworkStats({ seen: 142, matched: 0 });
        const stats = (mockContainer.shadowRoot as unknown as Element | null)?.querySelector("#csr-stats");
        expect(stats?.textContent).toContain("net 142 seen/0 hit");
    });

    it("should never mount into documentElement when body is missing (React hydration #418)", () => {
        const appendToHtml = vi.fn();
        const noBodyDoc = {
            getElementById: vi.fn().mockReturnValue(null),
            createElement: vi.fn((tag) => document.createElement(tag)),
            body: null,
            readyState: "loading",
            documentElement: { appendChild: appendToHtml },
            addEventListener: vi.fn(),
        } as unknown as Document;

        const controller = createUiController({ doc: noBodyDoc, win: mockWin });
        controller.render();

        // No container created, nothing appended to <html>.
        expect(appendToHtml).not.toHaveBeenCalled();
        expect(noBodyDoc.createElement).not.toHaveBeenCalled();
        // Render rescheduled on DOMContentLoaded instead.
        expect(noBodyDoc.addEventListener).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function),
            expect.objectContaining({ once: true })
        );
    });
});
