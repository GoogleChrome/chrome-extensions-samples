# Chrome Web Store Policy Validation Report
**Extension:** AI Search Revealer v1.3.6
**Date:** September 16, 2026
**Status:** ✅ **READY FOR SUBMISSION** (pending store-ops items below)

> v1.3.6: re-entrancy guard + worker-native terminal fetch (no stack overflow under hostile hook cycles; page survives, capture continues). No permission or data-handling changes since v1.3.0.

> v1.3.0 adds: per-conversation persistence + GET conversation backfill, Cited vs Retrieved split, turn_use_case/model_slug + filters, CSV/Markdown export + Ask-AI prompt. Storage disclosure updated accordingly (`enabled` + capped `csr:capturesByConversation`, local only).

> v1.1.0 validation was inaccurate and has been superseded. This report reflects the v1.2.0 code fixes.

---

## What changed in v1.2.0 (blockers fixed)

1. **Removed response tampering.** `src/interceptor.ts` no longer returns fake `200` responses for tracking domains. The fetch/XHR/EventSource hook is now strictly passive: `response.clone().text()` parsing only, all other traffic untouched.
2. **Hardened the page bridge.** `window.postMessage` now targets `window.location.origin` (fallback `"*"` only if origin throws), and `src/content.ts` validates `event.origin === location.origin` + `type === "AI_SEARCH_REVEALER_FOUND"`.
3. **Fixed dead toolbar button.** `manifest.json` adds `action.default_title`; `src/background.ts` implements `chrome.action.onClicked` to toggle the overlay, persists via `chrome.storage.local`, and clears the badge when disabled.
4. **Added user off-switch.** Overlay supports `setEnabled/isEnabled/destroy` (`src/ui/controller.ts`); disabled state removes UI and ignores captures. Preference survives reloads.
5. **Minimized permissions.** Removed `clipboardWrite` (copy uses `navigator.clipboard` on click, no permission needed) and removed all `host_permissions` (page access via `content_scripts.matches` only). Added `storage` (toggle flag) — justification in `CHROMEWEBSTORE.md`.
6. **Fixed privacy disclosure.** Favicon icons (`google.com/s2/favicons`, hostname only, `no-referrer`, lazy) are now disclosed in `PRIVACY_POLICY.md`, `CHROMEWEBSTORE.md` Data Safety, and code comments. Safe hostname parsing added (no uncaught `new URL` throws).
7. **Trademark + version hygiene.** Added "not affiliated" disclaimer; bumped to single version `1.2.0` across `package.json` + `manifest.json`.

---

## ✅ PASSING CHECKS

### 1. Privacy policy ✅
`PRIVACY_POLICY.md` v1.2.0 discloses local parsing, automatic favicon hostname transmission, user-initiated navigations, `storage` usage, and trademark notice.
**Action required:** host it at a public HTTPS URL and paste into Dashboard → Privacy Policy field.

### 2. Manifest V3 ✅
MV3, module service worker, `content_scripts` with `world: "MAIN"` for interceptor + isolated world for UI. No V2 APIs.

### 3. Code readability ✅
Vite-minified but not obfuscated; TypeScript source ships in repo. No `eval()`/`Function()`/remote scripts.

### 4. Single purpose ✅
"Reveal hidden AI search queries locally + user-initiated verification." All features (capture, sources, research links, context menus, toggle) directly serve it. Full text in `CHROMEWEBSTORE.md §2`.

### 5. User data privacy ✅ (with disclosure)
No first-party collection. Third-party transmissions declared: favicon hostnames (auto) + research URLs (click-only). Must mirror in Dashboard Data Safety form.

### 6. Permissions ✅ (minimal)
`contextMenus` + `storage` only, each justified in `CHROMEWEBSTORE.md §3`. No `tabs` (not needed for `tabs.create`), no `clipboardWrite`, no `host_permissions`.

### 7. Remote code ✅
No remote JS. Only remote content: favicon images (declared) + user-initiated navigations.

### 8. Toolbar functionality ✅
Action button now toggles overlay with title + badge feedback. No dead UI.

### 9. Listing readiness ⚠️ (ops items remain)
Name/description/icons/version are correct. Still needed: screenshots, promo tile, live policy URL, category selection.

---

## 📋 PRE-SUBMISSION CHECKLIST

- [x] Privacy policy rewritten with favicon disclosure
- [x] MV3 compliant, minimal permissions
- [x] No response tampering; passive read-only hook
- [x] Toolbar toggle + persistent disable
- [x] `postMessage` origin validation
- [x] Version unified at 1.2.0
- [x] `CHROMEWEBSTORE.md` created as submission source of truth
- [x] ZIP verified clean (9 files, no `.git`/`node_modules`)
- [ ] **Host privacy policy at public HTTPS URL, paste into Dashboard**
- [ ] **Prepare screenshots (1280×800 or 640×400) + 440×280 promo tile**
- [ ] **Fill Single Purpose + permission justifications from CHROMEWEBSTORE.md**
- [ ] **Fill Data Safety form (favicon hostname auto-send; research links click-only)**
- [ ] **Test on chatgpt.com, claude.ai, perplexity.ai, gemini.google.com**
- [ ] **Verify 2-Step Verification on publisher account**

---

## 🎯 OVERALL ASSESSMENT

**Status:** ✅ **READY FOR SUBMISSION** once the unchecked ops items above are done. No known code-level policy violations remain. Highest residual risk is reviewer scrutiny of the MAIN-world network hook — mitigated by read-only design, narrow matches, and the Single Purpose text in `CHROMEWEBSTORE.md`. If favicons draw pushback, fallback is letter avatars (zero transmission).

**Generated:** September 16, 2026
**Extension Version:** 1.2.0
**Manifest Version:** 3
