/** Stable per-conversation key from the page URL. ChatGPT uses /c/{id}; others fall back to host+path. */
export function getConversationKey(win: Window): string {
    try {
        const url = new URL(win.location.href);
        const chatMatch = url.pathname.match(/\/c\/([a-f0-9-]+)/i);
        if (chatMatch?.[1]) return `chatgpt:${chatMatch[1]}`;
        const path = `${url.hostname}${url.pathname}`.replace(/\/+$/, "").slice(0, 120);
        return path || url.hostname;
    } catch {
        return "default";
    }
}

/** Raw ChatGPT conversation id (uuid), or null when not on a /c/ page. */
export function getChatGPTConversationId(win: Window): string | null {
    try {
        const url = new URL(win.location.href);
        const m = url.pathname.match(/\/c\/([a-f0-9-]+)/i);
        return m?.[1] ?? null;
    } catch {
        return null;
    }
}
