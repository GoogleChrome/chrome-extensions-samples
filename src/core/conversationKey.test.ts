import { describe, expect, it } from "vitest";
import { getChatGPTConversationId, getConversationKey } from "./conversationKey";

function winFor(href: string): Window {
    return { location: { href } } as unknown as Window;
}

describe("getConversationKey", () => {
    it("parses a chatgpt conversation key from /c/ urls", () => {
        expect(getConversationKey(winFor("https://chatgpt.com/c/abc-123?x=1"))).toBe("chatgpt:abc-123");
    });

    it("falls back to host+path for other platforms", () => {
        expect(getConversationKey(winFor("https://claude.ai/chat/xyz"))).toBe("claude.ai/chat/xyz");
    });

    it("falls back to 'default' on an unparseable url", () => {
        expect(getConversationKey({ location: { href: "" } } as unknown as Window)).toBe("default");
    });
});

describe("getChatGPTConversationId", () => {
    it("extracts the raw uuid from a /c/ page", () => {
        expect(getChatGPTConversationId(winFor("https://chatgpt.com/c/abc-123"))).toBe("abc-123");
    });

    it("returns null off a /c/ page", () => {
        expect(getChatGPTConversationId(winFor("https://chatgpt.com/"))).toBeNull();
    });
});
