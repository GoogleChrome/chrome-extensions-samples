# Privacy Policy: AI Search Revealer

**Effective Date:** September 16, 2026
**Version:** 1.2.0
**Developer:** MIMR Growth Lab (https://mimrgrowthlab.com)

At **MIMR Growth Lab**, we take your privacy seriously. The **AI Search Revealer** Chrome extension is designed with a "Local-First" philosophy. This policy explains what is processed locally, what is transmitted (and when), and what we **do not** do.

---

## 1. Summary

- **AI page content is read locally only.** The extension passively reads streamed API responses on supported AI pages to extract search queries. It never modifies, blocks, or fabricates responses.
- **One automatic third-party transmission:** source favicon hostnames are sent to Google's favicon service (`https://www.google.com/s2/favicons`) to render source chips. No chat text, prompts, or account data is sent.
- **User-initiated navigation only otherwise:** clicking research links or context-menu items opens Google Search, Google Trends, AnswerThePublic, or ChatGPT with the query you chose. Nothing is sent until you click.
- **No analytics, no tracking, no account access.** We do not use analytics, tracking pixels, cookies, or remote servers. We never access your name, email, or chat history.

## 2. Local processing (network interception)

To provide its core functionality, the extension runs a MAIN-world content script on supported AI sites that clones matching `fetch`/`XHR`/`EventSource` responses and parses the clone in browser memory to extract:

- Search queries the model issued (e.g. `search_model_queries`, `web_search` tool-use queries)
- Cited/retrieved source URLs where the platform includes them
- Search-backend labels where the platform includes them (e.g. `search_engine`)

This data is **ephemeral**: it lives in the tab's memory and is destroyed when the tab closes or refreshes, unless you manually copy it. The hook is strictly read-only — it does not block, redirect, or alter site traffic.

## 3. Data transmitted

### 3a. Automatic: favicon icons
When sources are displayed, the overlay loads:
`https://www.google.com/s2/favicons?domain=<source-hostname>&sz=16`

This sends the **source hostname only** (e.g. `example.com`) to Google to fetch its icon. It does not send your prompts, queries, or AI responses. Images use `referrerpolicy="no-referrer"` and lazy loading. If you prefer zero transmission, disable the extension via the toolbar button (see §5).

### 3b. User-initiated only: research links & context menus
These fire **only when you click**:
- Overlay tools: `google.com/search`, `trends.google.com/trends/explore`, `answerthepublic.com/` with the query you selected.
- Context menus (selected text): "Verify with Google Search" → `google.com/search?q=...`; "Explain with ChatGPT" → `chatgpt.com/?q=...`.
- Attribution link: `mimrgrowthlab.com` (extension author site).

Your interactions with those third-party sites are governed by their respective privacy policies.

### 3c. What is never transmitted
We do not transmit prompts, responses, account identifiers, browsing history, or analytics events to MIMR Growth Lab or any other first-party server. We operate no backend for this extension.

## 4. Data stored locally

- `chrome.storage.local`: a single `enabled` boolean (toolbar on/off toggle). No queries, sources, or personal data are persisted.
- No sync, no cookies, no IndexedDB, no remote storage.

Uninstalling the extension removes the local setting.

## 5. Permissions disclosure

- `contextMenus`: provides "Verify with Google Search" and "Explain with ChatGPT" on selected text. Fires only on your right-click choice.
- `storage`: stores the toolbar enable/disable toggle (`enabled` flag) so your preference survives reloads.
- Content scripts on `chatgpt.com`, `chat.openai.com`, `claude.ai`, `perplexity.ai` (`www.` included), `gemini.google.com`: required to run the local read-only interceptor and overlay UI. Page access is declared via `content_scripts.matches`; the extension requests **no broad `host_permissions`** and **no `clipboardWrite`** (copy uses `navigator.clipboard` on your click gesture, which needs no permission).
- No access to `tabs`, history, bookmarks, cookies, or identity APIs.

## 6. Security

Because there is no first-party backend, your AI content stays in your tab's memory. Favicon fetches go directly to Google over HTTPS. We use Manifest V3, no remote code, no `eval()`, and same-origin `postMessage` validation between the page hook and the UI bridge.

## 7. Trademark notice

ChatGPT, Claude, Perplexity, and Gemini are trademarks of their respective owners. AI Search Revealer is an independent utility by MIMR Growth Lab and is not affiliated with, endorsed by, or sponsored by OpenAI, Anthropic, Perplexity AI, or Google.

## 8. Your rights

Since we collect no first-party data, there is nothing to access or delete on our servers. To stop all processing (including favicon loads), click the toolbar icon to disable the overlay or uninstall the extension. Disabling removes the visible UI and ignores further captures until re-enabled.

## 9. Contact us

**MIMR Growth Lab**
Website: https://mimrgrowthlab.com

> This policy is designed to satisfy Chrome Web Store "Single Purpose" and "User Data Privacy" disclosure requirements, including the Data Safety form (favicon hostname transmission must be declared).
