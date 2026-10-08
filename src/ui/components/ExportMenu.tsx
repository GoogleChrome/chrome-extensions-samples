import { announce, filteredQueries, lastError } from "../../store/captures";
import { buildCsv, buildMarkdown, download, REVEAL_PROMPT } from "../export";

export function ExportMenu({ doc, win }: { doc: Document; win: Window }) {
    const handleCsv = (): void => {
        const ok = download(doc, win, "ai-search-revealer.csv", "text/csv", buildCsv(filteredQueries.value));
        if (ok) {
            announce("ai-search-revealer.csv downloaded");
        } else {
            lastError.value = { message: "Download blocked by this page — try again.", tone: "warning" };
        }
    };

    const handleMarkdown = (): void => {
        const ok = download(doc, win, "ai-search-revealer.md", "text/markdown", buildMarkdown(filteredQueries.value));
        if (ok) {
            announce("ai-search-revealer.md downloaded");
        } else {
            lastError.value = { message: "Download blocked by this page — try again.", tone: "warning" };
        }
    };

    const handleAsk = (): void => {
        win.navigator.clipboard?.writeText(REVEAL_PROMPT).then(
            () => announce("Reveal prompt copied — paste it into the chat"),
            () => {
                lastError.value = { message: "Couldn't copy — try selecting the text manually.", tone: "error" };
            }
        );
    };

    return (
        <div class="csr-exports">
            <button type="button" class="csr-export-btn" title="Download queries + sources as CSV" onClick={handleCsv}>
                CSV
            </button>
            <button type="button" class="csr-export-btn" title="Download queries + sources as Markdown" onClick={handleMarkdown}>
                MD
            </button>
            <button
                type="button"
                class="csr-export-btn csr-ask-btn"
                title="Copy a prompt that asks the model to list its own search queries"
                onClick={handleAsk}
            >
                Ask AI
            </button>
        </div>
    );
}
