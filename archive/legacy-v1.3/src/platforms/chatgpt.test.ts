import { describe, expect, it } from "vitest";
import { ChatGPTContext } from "./chatgpt";

describe("ChatGPTContext.shouldIntercept", () => {
    it("matches the current federated streaming endpoint", () => {
        expect(
            ChatGPTContext.shouldIntercept("https://chatgpt.com/backend-api/f/conversation")
        ).toBe(true);
    });

    it("matches the conduit prewarm endpoint", () => {
        expect(
            ChatGPTContext.shouldIntercept("https://chatgpt.com/backend-api/f/conversation/prepare")
        ).toBe(true);
    });

    it("matches the logged-out anonymous endpoint", () => {
        expect(
            ChatGPTContext.shouldIntercept("https://chatgpt.com/backend-anon/f/conversation")
        ).toBe(true);
    });

    it("still matches the legacy endpoints", () => {
        expect(
            ChatGPTContext.shouldIntercept("https://chatgpt.com/backend-api/conversation")
        ).toBe(true);
        expect(ChatGPTContext.shouldIntercept("https://chatgpt.com/backend-api/lat/r")).toBe(
            true
        );
    });

    it("matches relative fetch paths used by the SPA", () => {
        expect(ChatGPTContext.shouldIntercept("/backend-api/f/conversation")).toBe(true);
    });

    it("rejects unrelated traffic", () => {
        expect(ChatGPTContext.shouldIntercept("https://claude.ai/api/organizations/x")).toBe(
            false
        );
        expect(ChatGPTContext.shouldIntercept("https://chatgpt.com/api/auth/session")).toBe(
            false
        );
        expect(ChatGPTContext.shouldIntercept("")).toBe(false);
    });
});

describe("ChatGPTContext.extract", () => {
    it("extracts queries from SSE metadata.search_model_queries", () => {
        const text = [
            'data: {"message":{"metadata":{"search_model_queries":["alpha","beta"]}}}',
            "data: [DONE]",
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(2);
        expect(nodes?.map(n => n.text)).toEqual(expect.arrayContaining(["alpha", "beta"]));
    });

    it("extracts queries from object-shaped search_model_queries ({ queries: [...] })", () => {
        const text = [
            'data: {"message":{"metadata":{"search_model_queries":{"queries":["current shape one","current shape two"]},"sonic_classification_result":{"simple_search_prob":0.9}}}}}',
            "data: [DONE]",
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(2);
        expect(nodes?.map(n => n.text)).toEqual(
            expect.arrayContaining(["current shape one", "current shape two"])
        );
    });

    it("extracts queries from tool_calls google_search arguments", () => {
        const text = [
            'data: {"message":{"content":{"parts":[{"tool_calls":[{"name":"google_search","arguments":{"query":"best pizza nyc"}}]}]}}}',
            "data: [DONE]",
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("best pizza nyc");
    });

    it("extracts queries from namespaced search tools with stringified arguments", () => {
        const text = [
            'data: {"message":{"content":{"parts":[{"tool_calls":[{"name":"browser.search","arguments":"{\\"query\\":\\"react server components docs\\"}"}]}]}}}',
            "data: [DONE]",
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("react server components docs");
    });

    it("falls back to regex parsing for legacy search_model_queries payloads", () => {
        const text =
            '{"search_model_queries":{"queries":["one","two"]},"other":"x"}';

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(2);
        expect(nodes?.map(n => n.text)).toEqual(expect.arrayContaining(["one", "two"]));
    });
    it("extracts sources from metadata.citations", () => {



        // Note: citations might be attached to a specific query or global. 
        // For now, if we find citations but no explicit query in the same chunk, 
        // we might verify they are returned if we can simulate a query availability or attach to a placeholder.
        // But typically citations come WITH the query or shortly after.
        // Let's assume a query is present for the test to pass the "found query" check

        const textWithQuery = [
            'data: {"message":{"metadata":{"search_model_queries":["query1"],"citations":[{"url":"https://test.com","title":"Test Title"}]}}}',
        ].join("\n");

        const nodes2 = ChatGPTContext.extract(textWithQuery);
        expect(nodes2).toHaveLength(1);
        expect(nodes2?.[0].sources).toHaveLength(1);
        expect(nodes2?.[0].sources?.[0].url).toBe("https://test.com");
    });

    it("extracts sources from search_result_groups and content_references", () => {
        const text = [
            'data: {"message":{"metadata":{"search_model_queries":{"queries":["grouped query"]},"search_result_groups":[{"domain":"example.com","entries":[{"url":"https://example.com/a","title":"Example A"}]}]},"content":{"parts":[{"content_references":[{"items":[{"url":"https://cited.com/b","title":"Cited B"}]}]}]}}}',
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("grouped query");
        expect(nodes?.[0].sources?.map(s => s.url)).toEqual(
            expect.arrayContaining(["https://example.com/a", "https://cited.com/b"])
        );
    });

    it("returns null when the stream contains no search activity", () => {
        const text = [
            'data: {"message":{"content":{"content_type":"text","parts":["Hello there"]},"metadata":{}}}',
            "data: [DONE]",
        ].join("\n");

        expect(ChatGPTContext.extract(text)).toBeNull();
    });
});

describe("ChatGPTContext.extract search_engine", () => {
    it("attaches the search backend from the same chunk (serpapi)", () => {
        const text = [
            'data: {"message":{"metadata":{"search_model_queries":{"queries":["latest gpt release"]},"search_engine":"serpapi"}}}',
            "data: [DONE]",
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("latest gpt release");
        expect(nodes?.[0].searchEngine).toBe("serpapi");
    });

    it("attaches labrador engine variants", () => {
        const text = [
            'data: {"message":{"metadata":{"search_model_queries":["arxiv attention paper"],"search_engine":"labrador-arxiv"}}}',
            "data: [DONE]",
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes?.[0].searchEngine).toBe("labrador-arxiv");
    });

    it("does not smear engines across chunks", () => {
        const text = [
            'data: {"message":{"metadata":{"search_model_queries":["first query"],"search_engine":"serpapi"}}}',
            'data: {"message":{"metadata":{"search_model_queries":["second query"]}}}',
            "data: [DONE]",
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(2);
        const byText = Object.fromEntries(nodes!.map(n => [n.text, n]));
        expect(byText["first query"].searchEngine).toBe("serpapi");
        expect(byText["second query"].searchEngine).toBeUndefined();
    });

    it("attributes a lone engine for unparseable chunks", () => {
        const text =
            'data: {"message":{"metadata":{"search_model_queries":{"queries":["partial query"]},"search_engine":"serpapi"}}}}...truncated{';

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("partial query");
        expect(nodes?.[0].searchEngine).toBe("serpapi");
    });

    it("leaves searchEngine undefined when the stream names no backend", () => {
        const text = [
            'data: {"message":{"metadata":{"search_model_queries":["plain query"]}}}',
            "data: [DONE]",
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes?.[0].searchEngine).toBeUndefined();
    });
});
