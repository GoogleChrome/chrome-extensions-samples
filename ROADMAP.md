# Roadmap

> Last updated: 2026-10-08

## Done (v2.0 rebuild)

- [x] Archived the pre-rebuild implementation to `archive/legacy-v1.3/`.
- [x] Fixed CI: it previously claimed to "Run ESLint" but only ran `tsc --noEmit`, with no test step, no build step, and no pinned Node version. Now runs typecheck + test + build on every push/PR, Node 22 pinned.
- [x] Pure, framework-agnostic `core/` layer: domain types, merge/prune logic, and the shared extraction toolkit (`walkJson`, `frameSse`/`frameBatchExecute`, `regexFallback`, `SourceMap`, `QueryRegistry`).
- [x] All four platform parsers (ChatGPT, Claude, Perplexity, Gemini) rewritten on the shared toolkit, each composing only the primitives it actually needs.
- [x] Fixed Gemini's fragile string-regex path matching (`path.match(/\[2\]\[(\d+)\]\[1\]/)`) with real array-index comparisons (`pathContains`/`pathEndsWith`).
- [x] Closed a real gap: Claude never extracted sources at all in v1.3; it now does (best-effort -- claude.ai's internal web-search result shape isn't externally documented, see the note in `src/platforms/claude.ts`).
- [x] Closed a test-coverage gap: Gemini's test suite now exercises the *real* path-indexed `batchexecute` array structure, not only the regex fallback (the old suite admitted this was "too complex to mock perfectly").
- [x] `@preact/signals` store replacing ~700 lines of manual `innerHTML`/DOM-patching, with an explicit `schemaVersion` and byte-budget guard replacing a silent `catch{}` on storage quota errors.
- [x] Full Preact UI rebuild in an "analyst dashboard" visual direction: solid surfaces, one accent color, real empty/loading/error states, an ARIA live region, `:focus-visible` rings, `prefers-reduced-motion` support.
- [x] Fixed a CSV-injection vulnerability (a leading `=`/`+`/`-`/`@` in an exported cell is now neutralized).
- [x] Replaced the backfill feature's hand-duplicated ChatGPT parser with a postMessage round-trip to the interceptor, reusing the real `ChatGPTContext.extract`.
- [x] Removed dead weight: a separately-built `content.css` that had nothing to style (the overlay is 100% Shadow-DOM-inlined).
- [x] Full documentation pass: README, ARCHITECTURE, AGENTS, SKILLS, CHANGELOG, this roadmap, and regenerated store-readiness docs.

## Next

- [ ] **Live verification pass.** Run the rebuilt extension against all 4 platforms with a real prompt via browser automation, compare against the archived v1.3 build as a before/after regression check, and capture real vendor payloads as genuine golden fixtures (today's platform test fixtures are hand-built approximations, not captured traffic -- see `src/platforms/*.test.ts`).
- [ ] **Validate Claude's source extraction against real traffic.** It's defensive/best-effort today (checks every plausible result-block shape) precisely because the real shape isn't documented; a live capture will confirm or correct it.
- [ ] **Real ESLint**, or an explicit decision not to bother. `npm run lint` is currently just an alias for `tsc --noEmit`; either wire up real linting or rename the script so it stops implying something that isn't there.
- [ ] **A lightweight import-boundary guard** for `interceptor.ts` never pulling in `preact`/`@preact/signals` (e.g. a small script in CI that inspects its resolved import graph) -- currently a code-review-time invariant only, documented in AGENTS.md/ARCHITECTURE.md but not mechanically enforced.
- [ ] **Chrome Web Store submission.** `CHROMEWEBSTORE.md` has the permissions justifications and data-use disclosure filled in; still needed: store screenshots (1280×800), a small promo tile, and a publicly hosted copy of `PRIVACY_POLICY.md` (GitHub Pages is the easiest option).
- [ ] **Re-sync the prebuilt copy** (`chatgpt-scan-extension/`) and `ai-search-revealer.zip` from the new `dist/` output before the next release (see the README's rebuild step).
- [ ] **Component-level tests** for the trickier UI pieces (`FilterSelect`, `EmptyState`, `QueryRow`'s copy-feedback states) -- today's test coverage is strongest in `core/`/`core/extract/`/`platforms/`; the UI layer is covered by typecheck + manual verification only so far.

## Explicitly out of scope for v2.0

These came up during the rebuild's design discussion and were deliberately deferred, not forgotten:

- A persistent side panel instead of the floating overlay.
- Cross-conversation search history / search across all captured conversations.
- Side-by-side source comparison across platforms.

If any of these become a priority, they're new features on top of a now-clean architecture, not another rebuild.
