# Changelog

## 2.0.0 — Ground-up rebuild (2026-10-08)

The entire extension was rebuilt from scratch at the user's request, due to accumulated tech debt in the v1.3 implementation. Nothing was deleted -- the previous implementation is preserved in full in `archive/legacy-v1.3/`. Feature parity was the explicit goal: same 4 platforms, same capture/filter/export features, architecturally clean instead of organically grown.

### What changed and why

**Architecture.** A 712-line `src/ui/controller.ts` doing manual `innerHTML` templating and imperative DOM patching is now a Preact component tree driven by a `@preact/signals` store -- no more special-cased re-render avoidance (the old code had a `refreshStatsLine()` function that existed purely to avoid stealing input focus on every tick). Four platform parsers that had each reimplemented their own version of "walk unknown JSON, extract queries, regex-fallback" (with real duplication, and in Gemini's case a heuristic function duplicated *within the same file*) now compose a shared toolkit (`src/core/extract/`).

**Two real correctness fixes, not just refactors:**
- Gemini's query-location matching used to build a formatted path string (e.g. `"[0][0][3][1][2]"`) and regex it -- fragile, since a literal object key like `"2"` could confuse it. It now compares real array-index sequences directly.
- Claude never extracted any sources in v1.3 (the field was always empty). It now does, defensively, covering every plausible web-search-result shape since claude.ai's internal API isn't externally documented.

**A real security fix:** CSV export didn't neutralize a leading `=`, `+`, `-`, or `@` in an exported cell -- a classic CSV/formula-injection vector if the file is later opened in Excel or Sheets. Fixed.

**A real test-coverage gap closed:** the old Gemini test suite explicitly only tested the regex fallback, with a comment admitting the real `batchexecute` path-indexed structure was "too complex to mock perfectly." The new suite constructs that real structure by hand and verifies the structural walk actually fires.

**CI was broken and nobody had noticed:** `.github/workflows/lint.yml` had a step literally labeled "Run ESLint" that actually just ran `tsc --noEmit` -- no real lint, no test step, no build step, ever, on any push or PR. Replaced with a workflow that runs typecheck, test, and build in sequence with a pinned Node version.

**Visual redesign:** the cyan/blue glassmorphic "AI HUD" look (read as generic/templated against a design audit, and its accent color nearly collided with Perplexity's own brand teal) is replaced with a neutral "analyst dashboard" direction -- solid surfaces, one desaturated accent, tighter radii, calmer motion.

**Accessibility fixes:** a permanent ARIA live region (the overlay was previously completely silent for screen readers on every dynamic update), `:focus-visible`-only focus rings, and `prefers-reduced-motion` handling for the live-dot pulse and expand/collapse transition.

**New, honestly-labeled states:** a composed empty state (replacing a bare text string), a loading skeleton gated behind a 400ms delay so the fast path never flashes it, and an error banner surfacing clipboard/download/storage failures that were previously silently swallowed.

**Dependency change:** `preact` and `@preact/signals` are the project's first-ever runtime dependencies (previously zero). Deliberately no `@preact/preset-vite` -- plain esbuild JSX transform keeps the content-script bundle lean.

**Dead code removed:** a separately Vite-built `content.css`, referenced in the manifest's isolated-world content script, which had nothing to style (the overlay's styling is 100% delivered via the Shadow-DOM-inlined stylesheet).

**Backfill redesign:** the old `conversation.ts` hand-duplicated a slimmed-down ChatGPT parser because MV3 content scripts can't safely share a module between two entries. The rebuild instead has `content.tsx` ask the already-loaded interceptor (which owns the real parser) to do the re-fetch-and-parse via a `postMessage` round-trip -- same real extractor, no duplicate.

### Migration notes

- Storage moved to a new, explicitly schema-versioned key (`csr:captures:v1`); the old flat key (`csr:capturesByConversation`) is read once for a one-time migration and never written to again.
- The data contract (`CapturedQuery`, `Source`) is unchanged -- nothing about what the extension captures or how it's shaped changed, only how it's produced and rendered.

---

## Earlier history (v1.3 and before)

See `archive/legacy-v1.3/README.md` and the git history prior to the rebuild for the pre-2.0 changelog (per-query search-engine tagging, toolbar toggle, passive interceptor hardening, etc.).
