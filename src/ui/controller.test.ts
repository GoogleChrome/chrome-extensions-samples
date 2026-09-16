import { describe, expect, it, vi, beforeEach } from "vitest";
import { createUiController } from "./controller";

describe("UiController", () => {
    let mockDoc: Document;
    let mockWin: Window;
    let mockContainer: HTMLDivElement;

    beforeEach(() => {
        mockContainer = document.createElement("div");
        mockContainer.id = "csr-root";

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

        const list = mockContainer.querySelector("#csr-query-list");
        expect(list).not.toBeNull();

        // Check for sources container (should FAIL initially)
        const sourcesContainer = mockContainer.querySelector(".csr-sources-container");
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

        const engineTag = mockContainer.querySelector(".csr-engine-tag");
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

        expect(mockContainer.querySelector(".csr-engine-tag")).toBeNull();
    });
});
