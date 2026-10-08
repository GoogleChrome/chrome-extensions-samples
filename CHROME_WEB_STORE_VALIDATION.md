# Chrome Web Store Policy Validation Report

**Extension:** AI Search Revealer v2.0.0
**Date:** October 8, 2026
**Status:** ✅ **Code-level checks pass** (store-ops items below still pending)

> v2.0.0 is a ground-up rebuild (see CHANGELOG.md). No permission or data-handling changes from v1.3.6's disclosed behavior — permissions stay at `contextMenus` + `storage`, no `host_permissions`, no new third-party transmissions beyond the existing favicon-hostname disclosure. This report re-validates the rebuilt code against the same policy checklist v1.3.6 passed.

---

## What changed since the last validation (v1.3.6)

The rebuild is a rewrite, not a feature change, from the Chrome Web Store's perspective:

1. **Same passive, read-only network hook.** `src/interceptor.ts` clones matching `fetch`/`XHR`/`EventSource`/`WebSocket` responses and parses the clone; nothing is blocked, redirected, or fabricated. Verified by the `fetch hook coexistence` regression test in `src/interceptor.test.ts`.
2. **Same origin-validated page bridge.** `window.postMessage` targets `window.location.origin` (fallback `"*"` only if origin access throws); `src/content.tsx` validates `event.source === window` and `event.origin === window.location.origin` before accepting a message.
3. **Same minimal permissions.** `contextMenus` + `storage` only. No `host_permissions`, no `clipboardWrite` (copy uses `navigator.clipboard` on a click gesture), no `tabs`.
4. **Same toolbar toggle + persistent disable.** `chrome.action.onClicked` toggles the overlay; the preference persists via `chrome.storage.local` and survives reloads.
5. **Same favicon disclosure.** `google.com/s2/favicons` requests (hostname only, `referrerpolicy="no-referrer"`, lazy-loaded) are disclosed in `PRIVACY_POLICY.md` and `CHROMEWEBSTORE.md`.
6. **New: a CSV-injection fix.** Exported CSV cells starting with `=`, `+`, `-`, or `@` are now prefixed to prevent them being read as spreadsheet formulas if the export is opened in Excel/Sheets — a genuine security improvement, not policy-relevant but worth noting.
7. **New: an explicit storage schema version**, with a one-time migration from the old unversioned key. Disclosed in `PRIVACY_POLICY.md` §4.

---

## ✅ PASSING CHECKS

### 1. Privacy policy ✅
`PRIVACY_POLICY.md` v2.0.0 discloses local parsing, automatic favicon hostname transmission, user-initiated navigations, `storage` usage (including the new schema-versioned key and the legacy-key migration), and the trademark notice.
**Action required:** host it at a public HTTPS URL and paste into Dashboard → Privacy Policy field (not yet done — see ROADMAP.md).

### 2. Manifest V3 ✅
MV3, module service worker, `content_scripts` with `world: "MAIN"` for the interceptor plus an isolated-world entry for the UI. No V2 APIs anywhere.

### 3. Code readability ✅
Vite-built but not obfuscated; full TypeScript source ships in the repo. No `eval()`/`Function()`/remote scripts anywhere in `src/`.

### 4. Single purpose ✅
"Reveal hidden AI search queries locally, plus user-initiated verification." Every feature (capture, sources, research links, context menus, toggle, export) directly serves it. Full text in `CHROMEWEBSTORE.md`.

### 5. User data privacy ✅ (with disclosure)
No first-party collection or server. Third-party transmissions are limited to favicon hostnames (automatic) and research-link navigations (click-only), both declared. Must be mirrored in the Dashboard's Data Safety form at submission time.

### 6. Permissions ✅ (minimal)
`contextMenus` + `storage` only, each justified in `CHROMEWEBSTORE.md`. No `tabs`, no `clipboardWrite`, no `host_permissions`.

### 7. Remote code ✅
No remote JS. Only remote content is favicon images (declared) and user-initiated navigations.

### 8. Toolbar functionality ✅
The action button toggles the overlay with title + badge feedback, unchanged from v1.3.6's fix for this.

### 9. Listing readiness ⚠️ (ops items remain)
Name/description/single-purpose text are filled in `CHROMEWEBSTORE.md`. Still needed: screenshots, a promo tile, a live-hosted privacy policy URL, and the publisher contact email.

---

## 📋 PRE-SUBMISSION CHECKLIST

- [x] Privacy policy updated for the rebuild (schema-versioned storage key, legacy-key migration)
- [x] MV3 compliant, minimal permissions, unchanged from the last validated version
- [x] No response tampering; passive read-only hook (regression-tested)
- [x] Toolbar toggle + persistent disable
- [x] `postMessage` origin validation
- [x] Version unified at 2.0.0 across `package.json` + `manifest.json`
- [x] `CHROMEWEBSTORE.md` updated as the submission source of truth
- [x] CSV-injection vector fixed in the export feature
- [ ] **Host the privacy policy at a public HTTPS URL, paste into Dashboard**
- [ ] **Prepare screenshots (1280×800 or 640×400) + a 440×280 promo tile**
- [ ] **Fill in the publisher contact email in `CHROMEWEBSTORE.md`**
- [ ] **Re-sync `chatgpt-scan-extension/` and `ai-search-revealer.zip` from the new `dist/` build**
- [ ] **Live-traffic validation pass against all 4 platforms** (see ROADMAP.md) — recommended before first submission of a rewritten extractor layer
- [ ] **Verify 2-Step Verification on the publisher account**

---

## 🎯 OVERALL ASSESSMENT

**Status:** Code-level policy checks pass, carried over unchanged from the previously-validated v1.3.6 behavior plus one new security fix (CSV injection). Submission is blocked only on store-ops items (screenshots, hosted privacy policy, contact email) and the recommended live-traffic validation pass for the rewritten extraction layer, not on any code-level policy concern.

**Generated:** October 8, 2026
**Extension Version:** 2.0.0
**Manifest Version:** 3
