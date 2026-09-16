# CHROMEWEBSTORE.md — AI Search Revealer (single source of truth for store submission)

**Last Updated:** 2026-09-16
**Extension version:** 1.3.0
**Manifest version:** 3

> Copy-paste from this file into the Chrome Developer Dashboard. Keep this file in sync whenever `manifest.json`, permissions, or data handling change.

---

## 1. Basic listing (copy-paste)

- **Name:** AI Search Revealer
- **Short description (132 chars max):** Reveals the hidden web-search queries ChatGPT, Claude, Perplexity & Gemini run before answering.
- **Detailed description (suggested):**
  > AI Search Revealer shows the hidden web-search queries AI assistants run behind the scenes before answering. When ChatGPT, Claude, Perplexity, or Gemini searches the web to answer your prompt, the extension captures those queries locally and shows them in a small overlay panel with one-click verification links.
  >
  > • Real-time query capture as searches are issued
  > • Works on ChatGPT, Claude, Perplexity, and Gemini
  > • Overlay panel with minimize-to-bubble and capture counter
  > • Per-query actions: verify on Google, check Google Trends, copy to clipboard
  > • Cited vs retrieved sources, backend/intent/model tags, filters, CSV/Markdown export
  > • Captures persist per conversation (refresh-safe) via local storage + conversation backfill
  > • Right-click actions for selected text: Verify with Google Search / Explain with ChatGPT
  > • Toolbar button toggles the overlay on/off; preference persists
  > • Local-first: interception and parsing happen in your browser. Source icons load from Google's favicon service (hostname only); all other network use is click-initiated.
  >
  > Independent utility by MIMR Growth Lab. Not affiliated with OpenAI, Anthropic, Perplexity AI, or Google.
- **Category:** Productivity / Developer Tools (pick one; Productivity recommended)
- **Language:** English

## 2. Single Purpose field (paste into Dashboard)

> Reveals hidden search queries used by AI chat platforms (ChatGPT, Claude, Perplexity, Gemini) by passively reading streamed API responses in the tab and displaying them in a local overlay UI. Provides one-click, user-initiated research links for verification. All parsing happens locally; the hook is read-only and never blocks or modifies site traffic.

## 3. Permissions justification (paste into review notes / justification boxes)

| Permission / scope | Why it is needed (plain English) |
|---|---|
| `contextMenus` | Adds two right-click items for selected text only: "Verify with Google Search" and "Explain with ChatGPT". Nothing happens until the user clicks the menu item, which opens the chosen site with the selected text. |
| `storage` | Stores the `enabled` toggle plus per-conversation captures (`csr:capturesByConversation`, max 20 conversations × 100 queries, oldest pruned) so refreshes don't lose queries and CSV/Markdown export works offline. Local only, never transmitted. |
| `content_scripts` on `chatgpt.com`, `chat.openai.com`, `claude.ai`, `perplexity.ai` (+`www`), `gemini.google.com` | Runs the read-only response reader and overlay UI on AI chat pages only. The MAIN-world script clones matching API responses and extracts search queries locally; the isolated-world script renders the panel. No other sites are touched. |
| No `host_permissions` | Intentionally omitted. Page access comes from `content_scripts.matches` alone to minimize the install warning. |
| No `tabs`, no `clipboardWrite`, no history/cookies/identity | Not requested. Copy uses `navigator.clipboard.writeText` on the user's click (no permission needed). New tabs are opened via `chrome.tabs.create` with a fully-formed URL, which needs no `tabs` permission. |

## 4. Data Safety / Privacy disclosure (must match PRIVACY_POLICY.md)

- **Privacy policy URL (Dashboard field):** `https://mimrgrowthlab.com/<privacy-page-path>` ← REPLACE with live HTTPS URL before submitting. Local `PRIVACY_POLICY.md` does not count.
- **Data collection:** No first-party collection. Developer operates no backend and receives no user data.
- **Data transmitted to third parties (declare this or face rejection):**
  - Automatic: source hostnames → `https://www.google.com/s2/favicons` (icon rendering, `no-referrer`, lazy-loaded).
  - User-initiated only: selected query/text → `google.com/search`, `trends.google.com`, `answerthepublic.com`, `chatgpt.com` when the user clicks a link/menu item.
- **Data stored:** `chrome.storage.local.enabled` (boolean) + `csr:capturesByConversation` (per-conversation queries/sources, capped, local only).
- **Limited Use / Google APIs:** Not applicable — no Google OAuth or restricted scopes used.

## 5. Assets checklist

- [x] Icons 16/48/128 PNG at exact sizes (`public/icons/`)
- [ ] Screenshot 1 (1280×800 or 640×400): overlay expanded with queries + sources on ChatGPT
- [ ] Screenshot 2: bubble/minimized state + Trends verification click
- [ ] Screenshot 3: context-menu items on selected text
- [ ] Small promo tile 440×280 (required for listing)
- [ ] (Optional) Marquee promo 1400×560
- [ ] Privacy policy live URL (see §4)
- [ ] 2-Step Verification enabled on publisher Google account
- [ ] Tested on chatgpt.com, claude.ai, perplexity.ai, gemini.google.com

## 6. Build / packaging (what to upload)

Source of truth: `public/manifest.json` + `src/`. Upload artifact: **`dist/`** (built via `npm run build`).

```bash
npm ci
npm run check
npm test
npm run build
cp dist/background.js dist/content.js dist/content.css dist/interceptor.js dist/manifest.json chatgpt-scan-extension/
rm -f ai-search-revealer.zip && (cd chatgpt-scan-extension && zip -qr ../ai-search-revealer.zip . -x '*.DS_Store*')
```

ZIP must contain only: `manifest.json`, `background.js`, `content.js`, `content.css`, `interceptor.js`, `icons/`. Verified clean for v1.2.0 (9 files). Never include `.git/`, `node_modules/`, `.env`, `dist/`, `src/`, `CHROMEWEBSTORE.md`.

## 7. Review-risk notes (what reviewers will probe)

1. **MAIN-world fetch/XHR/EventSource override** — justified as passive, read-only `clone().text()` parsing. No blocking, no fake responses (removed in v1.2.0). Point reviewers to `src/interceptor.ts` header comment.
2. **`postMessage` bridge** — restricted to `window.location.origin` with strict `type === "AI_SEARCH_REVEALER_FOUND"` check (`src/content.ts`, `src/interceptor.ts`). No wildcard trust.
3. **Toolbar action** — `chrome.action.onClicked` toggles overlay + persists to `storage`; `default_title` set. Icon is never dead.
4. **Favicon transmission** — disclosed here, in privacy policy, and in code comment (`src/ui/controller.ts`). If reviewer pushes back, fallback is to drop remote icons for letter avatars (zero transmission).
5. **Brand names** — listing + policy carry "not affiliated" disclaimer. No brand logos/icons bundled.

## 8. Version history

| Version | Date | Notes |
|---|---|---|
| 1.3.0 | 2026-09-16 | Fanout upgrade: per-conversation persistence + GET conversation backfill (refresh-safe); Cited vs Retrieved split with snippets; turn_use_case/model_slug capture + filters; CSV/Markdown export + Ask-AI reveal prompt. |
| 1.2.0 | 2026-09-16 | Store-readiness fix: removed fake-200 response tampering; same-origin postMessage; toolbar toggle + persistent disable; removed `clipboardWrite`/`host_permissions`, added `storage`+`default_title`; disclosed favicon transmission; trademark disclaimer. |
| 1.1.0 | 2025-12-20 | Prebuilt copy + validation doc (validation was inaccurate — see v1.2.0 fixes). |
