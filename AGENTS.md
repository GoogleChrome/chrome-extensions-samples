# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repository. Humans: this is also a reasonable contributor guide.

## What this project is

A Chrome MV3 extension that passively intercepts network traffic on ChatGPT/Claude/Gemini to reveal the web-search queries those assistants run. (Perplexity was supported through v2.0 but was removed once its endpoints went permanently dead -- see `ROADMAP.md` and `archive/perplexity-unsupported/README.md`.) See [README.md](README.md) for the user-facing description and [ARCHITECTURE.md](ARCHITECTURE.md) for how the code is organized.

## Before you start

- Read [ARCHITECTURE.md](ARCHITECTURE.md) first. The layering (`core/` is pure, `platforms/` only imports `core/extract/*`, `interceptor.ts` never imports `store/*` or `ui/*`) is load-bearing, not stylistic -- violating it can silently break the MV3 build (see "The interceptor/content boundary" in that doc).
- `archive/legacy-v1.3/` is the pre-rebuild implementation, kept for reference and git history. Don't edit it, and don't copy patterns from it without checking whether the rebuild already improved on them -- the whole point of the rebuild was fixing specific, named problems in that code (see [CHANGELOG.md](CHANGELOG.md)).

## Commands

```bash
npm ci                 # Install -- always use ci, not install, for reproducible builds
npm run check           # Typecheck (tsc --noEmit) -- run this before every commit
npm test                # Vitest -- run this before every commit
npm run build           # tsc && vite build -- the real end-to-end check
npm run dev              # Vite dev server (for local iteration, not for loading as an extension)
```

CI (`.github/workflows/ci.yml`) runs typecheck, test, and build on every push/PR, in that order, failing on any step. If you break one of these, CI will catch it -- don't skip running them locally first.

## Conventions

- **TypeScript strict mode is on, fully.** `noUnusedLocals`/`noUnusedParameters`/`noImplicitReturns` are real -- a `JsonVisitor` callback that returns `"skip"` on one branch needs an explicit `return undefined;` on the others, or `tsc` will fail.
- **No new runtime dependencies without a strong reason.** The project had zero for its entire v1.3 lifetime; `preact` + `@preact/signals` were added deliberately and discussed with the user first. Don't add a UI library, a state management library, a date library, etc. for convenience.
- **`interceptor.ts` stays framework-free.** It must never import anything from `src/store/` or `src/ui/` (which pull in `@preact/signals`/`preact`). It's a MAIN-world script injected at `document_start`, before the page's own scripts run -- it needs to stay small and fast.
- **Compose the extraction toolkit; don't duplicate it.** If you're touching a platform parser (`src/platforms/*.ts`) and find yourself writing a recursive walk, a regex fallback loop, or a source-dedup `Map`, check `src/core/extract/` first -- `walkJson`, `regexFallback`, `SourceMap`, `QueryRegistry` likely already do what you need. See [SKILLS.md](SKILLS.md) for the exact recipe.
- **Preserve real behavior by default.** When porting or touching platform-parsing logic, match the original's observed behavior (confirmed against the archived file or a test) unless you're deliberately fixing something -- and if you are, say so in a comment and the commit message, the way the Gemini path-matching fix and the Claude sources-gap fix are documented. Don't silently "improve" fragile heuristics (especially Gemini's `looksLikeSearchQuery`) without flagging the change.
- **Components read signals directly.** No prop drilling, no Context, no `useStore()` hook -- `import { capturedQueries } from '../../store/captures'` and read `.value` during render. Preact's signals integration handles the subscription automatically.
- **Pure logic goes in `core/`, with tests that need no mocking.** If a function doesn't touch the DOM or `chrome.*`, it belongs in `core/` and should be tested with plain Vitest, no setup.
- **CSS stays in `src/ui/tokens.css` / `src/ui/components.css`**, inlined into the Shadow DOM via the existing `?inline` pattern in `src/ui/mount.ts`. Don't introduce CSS Modules, styled-components, or inline `style` objects for anything that needs `:hover`/`:focus-visible`/`@media` -- see ARCHITECTURE.md's CSS section for why.

## Testing expectations

- Every new pure function in `core/` gets a test with zero mocking.
- Every platform parser change gets a test proving the specific behavior (don't just eyeball it -- the Gemini rewrite's test suite exercises the *real* path-indexed array structure, not only the regex fallback, specifically because the old test suite admitted it couldn't do this).
- Run `npm run check && npm test && npm run build` before considering any change done. All three, not just one.

## Things to avoid

- Don't add `eval()`, inline `<script>`, or inline event handlers anywhere -- MV3's CSP blocks them outright.
- Don't broaden `host_permissions` or add new permissions without updating `CHROMEWEBSTORE.md`'s justification table and `PRIVACY_POLICY.md` in the same change -- the Chrome Web Store review team reads both, and a mismatch is a common rejection reason.
- Don't reach for `any` to silence a TypeScript error from a monkey-patched browser global (`window.fetch`, `XMLHttpRequest.prototype.open`, etc.) -- prefer `unknown` + explicit casts, matching the existing style in `src/interceptor.ts`.
- Don't commit a build with `npm run build` failing -- if you're mid-refactor and it's expected to fail transiently (e.g. a manifest references an entry that doesn't exist yet), say so explicitly in the commit message, the way earlier rebuild commits did.
