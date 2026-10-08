# AI Search Revealer

**ChatGPT says it searched the web. It never says what for. This shows you.**

See the exact search queries ChatGPT, Claude, and Gemini run behind the scenes to answer you — and the real sources they found, split into what they actually cited versus what they just skimmed.

### Why this, not DevTools?

- **vs. Chrome DevTools' Network tab**: same underlying data, but raw, unlabeled JSON mixed in with hundreds of unrelated requests. This organizes it per platform, per query, with sources already split into ★ Cited vs Retrieved.
- **vs. asking the model "what did you search for?"**: that's the model recalling from memory — it can paraphrase or misremember its own actions. This reads the actual network response, so it's what really happened, not what the model thinks happened.
- **vs. not knowing at all** (the default): most people never realize there's a real, inspectable query behind "Searched the web" in the first place.

### Privacy, in one paragraph

Everything happens locally in your browser — there's no account, no first-party server, no analytics. The extension only ever extracts search queries and source URLs from the assistant's own network responses, never your prompts or its answers as prose. The one outbound request it makes automatically is a source's hostname to Google's public favicon service, to show a small icon next to each source — never your data. No broad `host_permissions`; see [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for the full policy.

Developed by [MIMR Growth Lab](https://mimrgrowthlab.com). Independent utility — not affiliated with OpenAI, Anthropic, or Google.

> **v2.0** is a ground-up rebuild of the extension (Preact + signals, a shared extraction toolkit, a redesigned "analyst dashboard" UI), followed by a full live-verification pass against real ChatGPT/Claude/Gemini traffic that found and fixed 10 real bugs (see [ROADMAP.md](ROADMAP.md)) — including the exact class of bug that made a prior version bad enough to uninstall. The previous implementation is preserved in [`archive/legacy-v1.3/`](archive/legacy-v1.3/). See [CHANGELOG.md](CHANGELOG.md) for what changed and why, and [ARCHITECTURE.md](ARCHITECTURE.md) for how the new codebase is put together.

## Features

- Captures the model's real search queries in real time, as they are issued.
- Supports ChatGPT, Claude, and Gemini. (Perplexity was supported through v2.0 but was removed once its endpoints went permanently dead -- see [ROADMAP.md](ROADMAP.md).)
- Overlay panel with minimize-to-bubble mode and a live capture counter badge.
- Toolbar button toggles the overlay on/off (preference persists via `chrome.storage`).
- Captures persist per conversation — refresh-safe via local storage + backfill from ChatGPT's conversation object.
- Sources split into ★ Cited vs Retrieved, with snippets where provided.
- Per-query backend (`via serpapi` etc.), intent (`turn_use_case`), and model tags, with platform/intent/text filters.
- Export CSV / Markdown, plus one-click "Ask AI" prompt that asks the model to list its own queries.
- One-click actions per query: verify on Google, check Google Trends, copy to clipboard.
- Shows cited/retrieved sources alongside queries where available (icons via Google favicon service — see Privacy).
- Context-menu items: "Verify with Google Search" and "Explain with ChatGPT" for selected text.
- Local-first: interception and parsing happen in your browser. See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md).
- Real empty/loading/error states, an ARIA live region for screen readers, and `prefers-reduced-motion` support.

## Supported platforms

| Platform   | Page(s)                              | What is captured                                  |
|------------|---------------------------------------|---------------------------------------------------|
| ChatGPT    | `chatgpt.com`, `chat.openai.com`     | `search_model_queries`, search tool calls, per-query search engine (`search_engine`), sources from `search_result_groups` / `content_references` |
| Claude     | `claude.ai`                          | `web_search` tool-use queries, plus web-search result/citation sources |
| Gemini     | `gemini.google.com`                  | Search queries from `batchexecute` responses, grounding sources |

## Installation

### Option A: Download the prebuilt zip

1. Download `ai-search-revealer.zip` from the [latest release](https://github.com/lightyoruichi/chatgpt-scan-extension/releases/latest) and unzip it.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer Mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped folder.

Each release's zip is built fresh from that release's tagged commit, so it never goes stale the way a zip committed directly to the repo root did before v2.0 (that v1.3-era convention is archived in `archive/legacy-v1.3/` -- don't load that copy, it's the old pre-rebuild code).

### Option B: Build from source

Requires [Node.js](https://nodejs.org/) 22 (see `.github/workflows/ci.yml` for the exact version CI runs).

```bash
npm ci
npm run build
```

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer Mode** (top-right toggle).
3. Click **Load unpacked** and select the generated `dist/` folder.
4. After pulling changes or editing `src/`, re-run `npm run build` and click the extension's reload button on `chrome://extensions/`.

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
npm run lint           # Same as check (no real ESLint is configured yet -- see ROADMAP.md)
npm test               # Run unit tests (Vitest)
npm run test:coverage  # Run tests with coverage
```

Project layout (see [ARCHITECTURE.md](ARCHITECTURE.md) for the full breakdown):

```
public/manifest.json         Extension manifest (MV3)
src/interceptor.ts            MAIN-world network interceptor (fetch/XHR/EventSource/WebSocket, read-only)
src/content.tsx                ISOLATED-world entry: boots the store, mounts the Preact overlay
src/platforms/                 Per-platform endpoint matchers + response parsers
src/core/                      Framework-agnostic domain types, merge logic, and the shared extraction toolkit
src/store/                     @preact/signals store + chrome.storage persistence
src/ui/                        Preact components, design tokens, and export helpers
src/background.ts              Service worker: badge, context menus, toolbar toggle
archive/legacy-v1.3/            The pre-rebuild implementation, kept for reference
archive/perplexity-unsupported/ Perplexity's extractor, removed when its endpoints went dead -- see ROADMAP.md
AGENTS.md                      Conventions for AI coding agents working in this repo
ARCHITECTURE.md                 How the codebase is put together
SKILLS.md                      Cookbook: how to extend the extractor/UI/platform list
ROADMAP.md                      What's done, what's next
CHANGELOG.md                    Notable changes per version
CHROMEWEBSTORE.md               Store listing, justifications, packaging checklist
PRIVACY_POLICY.md               Full privacy policy
dist/                           Build output (gitignored) -- load this via Load unpacked
```

`dist/` is gitignored and rebuilt fresh each time (`npm run build`); nothing under it is committed. After changing `src/`, re-run `npm run build` and reload the extension at `chrome://extensions/`.

## Permissions

- `contextMenus` — selection menu items (verify with Google / explain with ChatGPT, user-initiated only).
- `storage` — persists the toolbar toggle plus per-conversation captures (queries/sources, local only, capped at 20 conversations × 100 queries).
- Content scripts run on `chatgpt.com`, `chat.openai.com`, `claude.ai`, `gemini.google.com` for local read-only response parsing. No broad `host_permissions`; copy uses `navigator.clipboard` (no `clipboardWrite` needed).

## Privacy

Local-first parsing, no analytics, no first-party backend. Two disclosures: (1) source hostnames are sent to Google's favicon service for icons; (2) research links navigate to Google/Trends/AnswerThePublic/ChatGPT only when you click. Full policy: [PRIVACY_POLICY.md](./PRIVACY_POLICY.md). Store submission guide: [CHROMEWEBSTORE.md](./CHROMEWEBSTORE.md).

## Credits

Developed by [MIMR Growth Lab](https://mimrgrowthlab.com).

Copyright (c) MIMR Growth Lab. All rights reserved.
