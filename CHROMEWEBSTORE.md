# Chrome Web Store Listing — AI Search Revealer

> Last Updated: 2026-10-08

## Store Listing

**Extension Name**
AI Search Revealer

**Short Description**
Reveals the hidden web-search queries ChatGPT, Claude, Perplexity, and Gemini run before answering you.

**Detailed Description**

AI Search Revealer shows you the exact search queries ChatGPT, Claude, Perplexity, and Gemini run behind the scenes before answering your question — and the sources they found along the way.

Key features:
Captures each assistant's real search queries in real time, as they happen.
Works across ChatGPT, Claude, Perplexity, and Gemini.
A small overlay panel shows every captured query, with one-click links to verify it on Google, check Google Trends, or get deeper insights.
Sources are split into Cited (used in the answer) and Retrieved (found but not used), with snippets where available.
Filter captured queries by platform, intent, or text; export everything as CSV or Markdown.
A "Minimize to bubble" mode keeps the panel out of your way, with a live capture count.
The toolbar icon turns the overlay on or off at any time; your preference is remembered.

How to use it:
Visit ChatGPT, Claude, Perplexity, or Gemini and ask a question that triggers a web search.
The overlay panel appears automatically showing each captured query.
Click a query to copy it, or use the research links to dig further.
Click the toolbar icon any time to turn the overlay off or back on.

Privacy: everything happens locally in your browser. No analytics, no tracking, no account or sign-in required, and no first-party server — this extension doesn't have one. The only outside request it makes automatically is to Google's public favicon service, to show a small icon next to each source (only the source's domain name is sent, never your prompts or the assistant's answers). Full privacy policy: see the link below.

Questions or issues: open an issue on the project's GitHub repository, or contact MIMR Growth Lab.

**Category**
Productivity

**Single Purpose**
Reveals the web-search queries AI chat assistants run before answering, with one-click research links.

**Primary Language**
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | `public/icons/icon128.png` |
| Screenshot 1 | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile | 440×280 | ⬜ Not created | |

### Screenshot Notes

- Screenshot 1: the expanded panel open on a ChatGPT page with 3-4 captured queries showing platform/engine/intent tags and a mix of cited and retrieved sources.
- Screenshot 2: the collapsed bubble state with the capture-count badge, showing how unobtrusive the overlay is.
- Screenshot 3: the CSV/Markdown export in use, or the filter row narrowing down a larger capture list.

These need to be captured from the running extension (`npm run build`, load unpacked, visit a supported site, trigger a search) — not generated synthetically, since Chrome Web Store screenshots should show the real product.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `contextMenus` | permissions | Adds "Verify with Google Search" and "Explain with ChatGPT" to the right-click menu for selected text. Fires only on the user's explicit selection and click. |
| `storage` | permissions | Stores the toolbar on/off preference and the user's captured queries/sources locally on their device (capped at 20 conversations × 100 queries), so captures survive a page refresh and can be exported. Never synced to a remote server. |

No `host_permissions` are requested. Content scripts are declared narrowly via `content_scripts.matches` for the five supported origins only (`chatgpt.com`, `chat.openai.com`, `claude.ai`, `perplexity.ai`, `gemini.google.com`).

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes — read locally, see below.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | — | No |
| Health info | No | No | — | No |
| Financial info | No | No | — | No |
| Authentication info | No | No | — | No |
| Personal communications | No | No | — | No |
| Location | No | No | — | No |
| Web history | No | No | — | No |
| User activity | No | No | — | No |
| Website content | Yes (search queries and source URLs the assistant surfaces, parsed from the page's own network responses) | Only a source's hostname, to Google's favicon service | Rendering a small icon next to each source in the overlay | Yes — Google's public favicon endpoint (`google.com/s2/favicons`), hostname only, no other data |

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**
`[TBD — host PRIVACY_POLICY.md at a public URL (GitHub Pages is the simplest option) before submitting]`

See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for the full text.

## Distribution

**Visibility**: Public (suggested — confirm before submitting)
**Regions**: All regions (suggested — confirm before submitting)

## Developer Info

**Publisher Name**
MIMR Growth Lab

**Contact Email**
`[fill in before submitting]`

**Support URL / Email**
`[fill in — e.g. a GitHub Issues link]`

**Homepage URL**
https://mimrgrowthlab.com

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 2.0.0 | 2026-10-08 | Ground-up rebuild (Preact + signals, redesigned UI, Gemini path-matching fix, Claude source-extraction gap closed, CSV-injection fix). See CHANGELOG.md. | Draft |

<!-- Pre-2.0 version history was not tracked in this file; see archive/legacy-v1.3/ and git history. -->

## Review Notes

### Known Issues / Limitations

- Claude's source extraction is best-effort: claude.ai's internal web-search result shape isn't externally documented, so the extractor defensively checks several plausible shapes. If a reviewer or user reports missing Claude sources, this is the first place to look.
- Gemini's extraction relies partly on a heuristic ("does this string look like a search query") since Google's internal `batchexecute` wire format is undocumented. Occasional false negatives/positives are possible.
- No live-traffic validation has been performed yet against the rebuilt extractors (see ROADMAP.md) — recommended before first submission of 2.0.0.

### Rejection History

None yet.
