import { beforeEach, describe, expect, it } from "vitest";
import {
    addQuery,
    announce,
    announcement,
    capturedQueries,
    filteredQueries,
    importQueries,
    isCollapsed,
    isEnabled,
    platformFilter,
    queryCount,
    resetFilters,
    textFilter,
    useCaseFilter,
} from "./captures";
import type { CapturedQuery } from "../core/types";

function q(overrides: Partial<CapturedQuery> & { text: string }): CapturedQuery {
    return { timestamp: 0, ...overrides };
}

describe("captures store", () => {
    beforeEach(() => {
        capturedQueries.value = [];
        isCollapsed.value = true;
        isEnabled.value = true;
        resetFilters();
    });

    it("addQuery merges into capturedQueries and reports whether anything changed", () => {
        expect(addQuery(q({ text: "a" }))).toBe(true);
        expect(capturedQueries.value.map((x) => x.text)).toEqual(["a"]);
        expect(queryCount.value).toBe(1);

        // Re-adding the exact same query changes nothing.
        expect(addQuery(q({ text: "a" }))).toBe(false);
    });

    it("importQueries folds a batch in and is a no-op for an empty batch", () => {
        expect(importQueries([q({ text: "a" }), q({ text: "b" })])).toBe(true);
        expect(capturedQueries.value).toHaveLength(2);
        expect(importQueries([])).toBe(false);
    });

    it("filteredQueries reacts to platform/useCase/text filters", () => {
        capturedQueries.value = [
            q({ text: "chatgpt query", platform: "ChatGPT", turnUseCase: "shopping" }),
            q({ text: "claude query", platform: "Claude" }),
        ];

        platformFilter.value = "ChatGPT";
        expect(filteredQueries.value.map((x) => x.text)).toEqual(["chatgpt query"]);

        platformFilter.value = "all";
        textFilter.value = "claude";
        expect(filteredQueries.value.map((x) => x.text)).toEqual(["claude query"]);

        textFilter.value = "";
        useCaseFilter.value = "shopping";
        expect(filteredQueries.value.map((x) => x.text)).toEqual(["chatgpt query"]);
    });

    it("resetFilters clears all three filters", () => {
        platformFilter.value = "ChatGPT";
        useCaseFilter.value = "shopping";
        textFilter.value = "x";
        resetFilters();
        expect(platformFilter.value).toBe("all");
        expect(useCaseFilter.value).toBe("all");
        expect(textFilter.value).toBe("");
    });

    it("announce() changes the announcement signal even for a repeated message", () => {
        announce("3 new queries captured");
        const first = announcement.value;
        announce("3 new queries captured");
        expect(announcement.value).not.toBe(first);
    });

    it("isEnabled/isCollapsed are plain toggleable signals", () => {
        isEnabled.value = false;
        expect(isEnabled.value).toBe(false);
        isCollapsed.value = false;
        expect(isCollapsed.value).toBe(false);
    });
});
