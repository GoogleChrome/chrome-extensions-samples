import { IPlatformExtractor } from "./types";

export const ClaudeContext: IPlatformExtractor = {
    name: "Claude",
    shouldIntercept(url: string): boolean {
        return (
            (url.includes("/api/organizations/") &&
                url.includes("/chat_conversations/")) ||
            url.includes("/completion")
        );
    },
    extract(text: string): { text: string; sources?: import("./types").Source[] }[] | null {
        const queries = new Set<string>();

        // 1. Try JSON parsing (Full Response)
        try {
            const data = JSON.parse(text);
            if (data?.chat_messages && Array.isArray(data.chat_messages)) {
                data.chat_messages.forEach((msg: any) => {
                    msg?.content?.forEach((block: any) => {
                        if (block?.type === "tool_use" && block?.name === "web_search" && block?.input?.query) {
                            queries.add(block.input.query);
                        }
                    });
                });
            }
            if (data?.completion?.input?.query) {
                queries.add(data.completion.input.query);
            }
        } catch (e) {
            // Not a full JSON or streaming fragment
        }

        // 2. Regex Fallback (Streaming & Partial Fragments)
        // This is much more robust for streaming tool use
        const toolUseRegex = /"type"\s*:\s*"tool_use"[^}]*"name"\s*:\s*"web_search"[^}]*"input"\s*:\s*\{[^}]*"query"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        let match;
        while ((match = toolUseRegex.exec(text)) !== null) {
            try {
                // Unescape JSON string
                const query = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                if (query) queries.add(query);
            } catch (e) { }
        }

        return queries.size > 0 ? Array.from(queries).map(q => ({ text: q })) : null;
    },
};
