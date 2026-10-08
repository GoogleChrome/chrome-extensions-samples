# Chrome Web Store Listing — AI Search Revealer

> Last Updated: 2026-10-08

## Store Listing

**Extension Name**
AI Search Revealer

**Short Description**
ChatGPT says it searched the web. It never says what for. This shows you.

**Detailed Description**

ChatGPT, Claude, and Gemini all search the web on your behalf, then just say "Searched the web" — no detail. The only ways to find out what they actually searched for today are both bad: dig through Chrome DevTools' raw, unlabeled network traffic, or ask the model to recall its own query from memory (it can paraphrase or misremember). AI Search Revealer reads the actual response the assistant already got back, and shows you the real query and the real sources — organized, not raw.

Key features:
Captures each assistant's real search queries in real time, as they happen — the actual network response, not the model's self-report.
Works across ChatGPT, Claude, and Gemini.
A small overlay panel shows every captured query, with one-click links to verify it on Google, check Google Trends, or get deeper insights.
Sources are split into ★ Cited (used in the answer) and Retrieved (found but not used), with snippets where available.
Filter captured queries by platform, intent, or text; export everything as CSV or Markdown.
A "Minimize to bubble" mode keeps the panel out of your way, with a live capture count.
The toolbar icon turns the overlay on or off at any time; your preference is remembered.

How to use it:
Visit ChatGPT, Claude, or Gemini and ask a question that triggers a web search.
The overlay panel appears automatically showing each captured query.
Click a query to copy it, or use the research links to dig further.
Click the toolbar icon any time to turn the overlay off or back on.

Privacy, in one paragraph: everything happens locally in your browser — no account, no first-party server, no analytics, nothing synced anywhere. The extension only ever extracts search queries and source URLs from the assistant's own network responses, never your prompts or its answers as prose. The one outbound request it makes automatically is a source's hostname to Google's public favicon service, to show a small icon next to each source — never your data. Full privacy policy: see the link below.

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

No `host_permissions` are requested. Content scripts are declared narrowly via `content_scripts.matches` for the four supported origins only (`chatgpt.com`, `chat.openai.com`, `claude.ai`, `gemini.google.com`).

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

- Claude's source extraction is best-effort: claude.ai's internal web-search result shape isn't externally documented, so the extractor defensively checks several plausible shapes. Live-verified 2026-10-08 against a real `web_search` tool call — captured queries showed real cited sources correctly. If a reviewer or user reports missing Claude sources, this is the first place to look.
- Gemini's extraction relies partly on a heuristic ("does this string look like a search query") since Google's internal `batchexecute` wire format is undocumented. Occasional false negatives/positives are possible — one real false positive was found and fixed via live testing on 2026-10-08 (see ROADMAP.md); treat this as an ongoing risk area, not a closed one.
- Live-traffic validation **has** been performed (2026-10-08, via browser automation against real ChatGPT/Claude/Gemini sessions) — see ROADMAP.md for the full pass, the 5 real bugs it found and fixed, and the 2 follow-up extraction bugs found and fixed afterward. Perplexity was removed rather than fixed; its endpoints are permanently dead (see ROADMAP.md and `archive/perplexity-unsupported/README.md`).

### Rejection History

None yet.
