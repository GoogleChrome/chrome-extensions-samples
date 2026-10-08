export function ToolLinks({ query }: { query: string }) {
    const encoded = encodeURIComponent(query);
    return (
        <div class="csr-tools">
            <a
                class="csr-tool-link"
                href={`https://www.google.com/search?q=${encoded}`}
                target="_blank"
                rel="noreferrer"
                title="Verify on Google"
                aria-label="Verify on Google"
            >
                🔎
            </a>
            <a
                class="csr-tool-link"
                href={`https://trends.google.com/trends/explore?q=${encoded}`}
                target="_blank"
                rel="noreferrer"
                title="Google Trends"
                aria-label="Google Trends"
            >
                📈
            </a>
            <a
                class="csr-tool-link"
                href={`https://answerthepublic.com/?q=${encoded}`}
                target="_blank"
                rel="noreferrer"
                title="Deep Insights"
                aria-label="AnswerThePublic"
            >
                🧠
            </a>
        </div>
    );
}
