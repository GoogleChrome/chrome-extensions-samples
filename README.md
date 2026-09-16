# AI Search Revealer

A Chrome extension (Manifest V3) that reveals the hidden web-search queries AI assistants run behind the scenes before answering. When ChatGPT, Claude, Perplexity, or Gemini searches the web to answer your prompt, this extension captures those queries and shows them in a small overlay panel with one-click research links.

Developed by [MIMR Growth Lab](https://mimrgrowthlab.com). Independent utility — not affiliated with OpenAI, Anthropic, Perplexity AI, or Google.

## Features

- Captures the model's real search queries in real time, as they are issued.
- Supports ChatGPT, Claude, Perplexity, and Gemini.
- Overlay panel with minimize-to-bubble mode and a live capture counter badge.
- Toolbar button toggles the overlay on/off (preference persists via `chrome.storage`).
- One-click actions per query: verify on Google, check Google Trends, copy to clipboard.
- Shows cited/retrieved sources alongside queries where available (icons via Google favicon service — see Privacy).
- Context-menu items: "Verify with Google Search" and "Explain with ChatGPT" for selected text.
- Local-first: interception and parsing happen in your browser. See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md).

## Supported platforms

| Platform   | Page(s)                              | What is captured                                  |
|------------|--------------------------------------|---------------------------------------------------|
| ChatGPT    | `chatgpt.com`, `chat.openai.com`     | `search_model_queries`, search tool calls, per-query search engine (`search_engine`), sources from `search_result_groups` / `content_references` |
| Claude     | `claude.ai`                          | `web_search` tool-use queries                     |
| Perplexity | `perplexity.ai`                      | Search queries, citations, and web results        |
| Gemini     | `gemini.google.com`                  | Search queries from `batchexecute` responses, grounding sources |

## Installation

### Option A: Load the prebuilt copy

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer Mode** (top-right toggle).
3. Click **Load unpacked** and select the `chatgpt-scan-extension/` folder in this repo.
4. Alternatively, unzip `ai-search-revealer.zip` and load the extracted folder instead.

### Option B: Build from source

Requires [Node.js](https://nodejs.org/) (see `.github/workflows` for the CI version).

```bash
npm ci
npm run build
```

Then load the generated `dist/` folder via **Load unpacked** as above.

## Usage

1. Visit a supported AI chat page and ask a question that triggers web search.
2. The overlay panel appears with each captured query and its sources.
3. Click a query's action links to verify it on Google or Google Trends, or click the query text to copy it.
4. Click the minimize button to collapse the panel into a bubble; click the bubble to expand it again.
5. Click the toolbar icon to disable/enable the overlay entirely.

## Development

```bash
npm run dev            # Start Vite dev server
npm run build          # Typecheck and build to dist/
npm run check          # Typecheck only (tsc --noEmit)
npm run lint           # Same as check (runs in CI)
npm test               # Run unit tests (Vitest)
npm run test:coverage  # Run tests with coverage
```

Project layout:

```
public/manifest.json        Extension manifest (MV3)
src/content.ts              Isolated-world content script (UI bridge)
src/interceptor.ts          MAIN-world network interceptor (fetch/XHR/EventSource, read-only)
src/platforms/              Per-platform endpoint matchers and response parsers
src/ui/controller.ts        Overlay panel controller
CHROMEWEBSTORE.md           Store listing, justifications, packaging checklist
chatgpt-scan-extension/     Prebuilt loadable copy of the extension
ai-search-revealer.zip      Zipped release of the prebuilt copy
```

After changing `src/`, rebuild and re-sync the prebuilt copy and zip before releasing:

```bash
npm run build
cp dist/background.js dist/content.js dist/content.css dist/interceptor.js dist/manifest.json chatgpt-scan-extension/
rm -f ai-search-revealer.zip && (cd chatgpt-scan-extension && zip -qr ../ai-search-revealer.zip . -x '*.DS_Store*')
```

## Permissions

- `contextMenus` — selection menu items (verify with Google / explain with ChatGPT, user-initiated only).
- `storage` — persists the toolbar enable/disable toggle (`enabled` flag only).
- Content scripts run on `chatgpt.com`, `chat.openai.com`, `claude.ai`, `perplexity.ai`, `gemini.google.com` for local read-only response parsing. No broad `host_permissions`; copy uses `navigator.clipboard` (no `clipboardWrite` needed).

## Privacy

Local-first parsing, no analytics, no first-party backend. Two disclosures: (1) source hostnames are sent to Google's favicon service for icons; (2) research links navigate to Google/Trends/AnswerThePublic/ChatGPT only when you click. Full policy: [PRIVACY_POLICY.md](./PRIVACY_POLICY.md). Store submission guide: [CHROMEWEBSTORE.md](./CHROMEWEBSTORE.md).

## Credits

Developed by [MIMR Growth Lab](https://mimrgrowthlab.com).

Copyright (c) MIMR Growth Lab. All rights reserved.
