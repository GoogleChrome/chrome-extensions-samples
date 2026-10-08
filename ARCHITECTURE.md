# Architecture

This document explains how the v2.0 rebuild is put together and why. For the rationale behind the rebuild itself (what was wrong with v1.3), see [CHANGELOG.md](CHANGELOG.md). For step-by-step recipes (adding a platform, adding a component), see [SKILLS.md](SKILLS.md).

## Directory layout

```
src/
  core/
    types.ts              CapturedQuery, PersistedSchemaV1, SCHEMA_VERSION, size caps
    merge.ts (+.test)     Pure merge/prune reducers -- zero DOM, zero chrome.*
    conversationKey.ts     Pure URL -> conversation-key / ChatGPT-id parsing
    extract/
      walk.ts              Generic walkJson(root, visitor) + pathContains/pathEndsWith
      frame.ts             frameSse() / frameBatchExecute() chunk framing
      regex.ts             regexFallback(text, rules[]) with per-rule reject() guards
      sources.ts           SourceMap -- dedupe, merge, cited-first sort
      registry.ts          QueryRegistry -- per-query metadata + the shared source list
      index.ts             Barrel export; the only import surface platforms/*.ts use
  platforms/
    types.ts               IPlatformExtractor / Source / ExtractedQuery contract
    chatgpt.ts  claude.ts  perplexity.ts  gemini.ts
  store/
    captures.ts            @preact/signals store: the UI's only data dependency
    persistence.ts (+.test) chrome.storage adapter: schemaVersion + byte-budget guard
  ui/
    tokens.css              Design tokens (colors, spacing, radius, type, motion)
    components.css          Structural styles
    export.ts               Pure helpers: buildCsv/buildMarkdown/csvCell/download
    mount.ts                 Shadow DOM mounting (ensureMount), critical-CSS fallback
    components/              Preact components (see the Component tree section)
  interceptor.ts             MAIN-world network hook -- framework-free, dependency-light
  content.tsx                ISOLATED-world entry: boots the store, mounts the UI
  background.ts               Service worker
  debug.ts                     Structured logging / debug ring buffer
```

## Why this split

The pre-rebuild codebase (now in `archive/legacy-v1.3/`) had three tangled concerns in a handful of large files: network capture, parsing, and UI were all intermixed, and each of the four platform parsers had independently reimplemented the same "walk unknown JSON, extract queries/sources, regex-fallback" idea with real duplication. The rebuild separates these into layers with a one-way dependency direction:

```
interceptor.ts ──> platforms/*.ts ──> core/extract/*  (pure, no DOM, no chrome.*)
content.tsx ──────> store/* ───────> core/types.ts, core/merge.ts
content.tsx ──────> ui/components/* ─> store/* (signals read directly, no prop drilling)
```

`core/` never imports from `store/` or `ui/`. `platforms/` never imports from `store/` or `ui/`. This isn't just tidiness: it's what keeps `interceptor.ts` safe to bundle. See "The interceptor/content boundary" below.

## The extraction toolkit (`core/extract/`)

Each platform parser looked similar at a glance but actually diverged a lot:

- **ChatGPT** and **Perplexity** both do "recursive walk + regex fallback," but ChatGPT walks the whole parsed chunk while Perplexity walks per-SSE-line.
- **Claude** does no recursion at all -- direct, hardcoded property access (`chat_messages[].content[].type === "tool_use"`), because its payload shape is simple and fixed.
- **Gemini** has a transport layer the others don't: Google's `batchexecute` wire format (`)]}'` XSSI prefix, `\n<digits>\n`-delimited parts), a path-indexed array structure, and a heuristic word-scoring function to guess whether an arbitrary string is a search query.

Because of this, the toolkit is a set of **composable primitives**, not one forced shape every platform must fit:

| Primitive | What it replaces |
|---|---|
| `walkJson(root, visitor)` | Each platform's own hand-rolled recursive walk. Visitors get a real `PathSegment[]` (array indices/keys), not a formatted string -- `pathContains`/`pathEndsWith` do exact, contiguous subsequence matching. This directly replaced Gemini's `path.match(/\[2\]\[(\d+)\]\[1\]/)` string-regex approach, which was fragile (a literal object key named `"2"` could have confused it). |
| `frameSse` / `frameBatchExecute` | ChatGPT/Perplexity's identical SSE line-splitting, and Gemini's XSSI-prefix-stripping + part-splitting. |
| `regexFallback(text, rules[])` | The layered regex fallbacks every platform has for truncated streaming chunks, with a `reject(text, matchIndex)` guard (used by Perplexity to exclude `related_queries`/`suggested_queries` blocks). |
| `SourceMap` | Dedup-by-URL, fill-missing-fields-only, cited-first sort -- the same logic every platform needs for its source list. |
| `QueryRegistry` | First-seen order, first-seen-wins metadata (engine/intent/model/turn-id), and the one whole-response source list every platform (that has sources at all) attaches to every query it finds. |

**A real, verified behavior**, not an assumption: all three platforms with sources (ChatGPT, Perplexity, Gemini) build **one source list across the entire response** and attach that same list to every query in it -- there's no per-chunk or per-query source scoping in any of them. This was discovered by re-reading the archived originals directly (an earlier design draft had assumed ChatGPT did per-query attribution; it doesn't), and is now an explicit, named method (`QueryRegistry.setSources`) rather than an implicit side effect.

## The interceptor/content boundary

`vite.config.ts` uses unhashed `chunkFileNames: '[name].js'` because `public/manifest.json` references output filenames literally -- and MV3 `content_scripts` are injected as classic scripts, not ES modules, so they **cannot load an extra chunk** that Rollup might hoist out when two entries share an import.

`interceptor.ts` (MAIN world, `document_start`) is the only consumer of `platforms/*` and `core/extract/*`. `content.tsx` (ISOLATED world, `document_idle`) never imports them. When `content.tsx` needs a ChatGPT conversation re-parsed (the "backfill" feature, for turns that streamed before the extension loaded), it posts a `AI_SEARCH_REVEALER_REQUEST_BACKFILL` message to the already-loaded interceptor, which does the fetch + `ChatGPTContext.extract(...)` and posts the result back. This reuses the exact same parser as live capture, instead of the old `conversation.ts`'s hand-duplicated mini-parser.

`interceptor.ts` must never import `store/*` (pulls in `@preact/signals`) or `ui/*` (pulls in `preact`) -- it has no UI and must stay a small, dependency-light bundle that runs before the page's own scripts. There's no automated lint rule enforcing this yet (see ROADMAP.md); it's a code-review-time invariant for now.

## The store (`src/store/captures.ts`)

A `@preact/signals` store is the **entire data contract** between the capture pipeline and the UI -- there's no prop drilling, no Context, no `useStore()` hook. Components import a signal directly and read `.value` during render; `@preact/signals`' Preact integration automatically subscribes that component to re-render on change.

Key signals: `capturedQueries`, `isCollapsed`, `isEnabled`, `isRestoring`, `platformFilter`/`useCaseFilter`/`textFilter` (persisted across collapse/expand because they live here, not in a component), `networkStats`, `lastError`, `announcement` (drives the ARIA live region). `filteredQueries` and `queryCount` are `computed()`.

`store/persistence.ts` is the only thing that talks to `chrome.storage.local`: it adds an explicit `schemaVersion` (absent in v1.3's storage shape), measures the write's byte size before committing it, and prunes the oldest conversations to fit a budget instead of attempting the write and silently swallowing a quota exception.

## UI component tree

```
OverlayRoot                 (owns the single .csr-container div; Bubble/Panel render only their inner content)
├─ LiveRegion               (sr-only, permanently mounted, drives screen-reader announcements)
└─ Bubble | Panel           (collapsed vs expanded, toggled by isCollapsed)
   Panel:
   ├─ Header
   ├─ Toolbar  -> FilterSelect x2, SearchInput, ExportMenu, StatsLine
   └─ .csr-content
      ├─ ErrorBanner        (conditional; clipboard/download/storage failures)
      └─ QueryList          (LoadingSkeleton | EmptyState | rows)
         └─ QueryRow x N    -> PlatformTag, MetaTag x0-3, ToolLinks, copy button, SourceChipGroup x0-2
```

Design direction: solid neutral surfaces, one desaturated violet-blue accent (`--csr-accent`, chosen to sit far from all four platform brand hues and from the gold "cited" semantic color -- v1.3's cyan accent nearly collided with Perplexity's own brand teal), no `backdrop-filter`/glassmorphism, standard/emphasized-decelerate motion instead of bouncy spring easing. Full token list in `src/ui/tokens.css`.

Preserved from v1.3 (these were already correct): the Shadow DOM mounting strategy (never mount into `<html>`/`documentElement` -- this previously broke ChatGPT's React hydration), the critical-CSS-then-full-CSS inlining so the panel can never render unstyled, the light-DOM fallback for environments without Shadow DOM, and the `csr-*` class-prefix convention.

## Build pipeline

Plain esbuild JSX transform (`esbuild.jsx: 'automatic'`, `jsxImportSource: 'preact'` in `vite.config.ts`), deliberately **no `@preact/preset-vite`** -- that preset pulls in Babel and Prefresh HMR, neither of which helps a content script that's never live-reloaded inside the host page. Three Rollup entries (`content`, `interceptor`, `background`), each a self-contained bundle with no shared chunks.

## Testing

Vitest + jsdom, no component-testing library -- hand-rolled mocks (same style as before). `core/` and `core/extract/` are pure and need no mocking at all. Platform parsers have inline fixture literals (not yet captured from live traffic -- see ROADMAP.md); Gemini's test suite specifically constructs the real path-indexed `batchexecute` array structure (`root[0][0][3][1][N][0]`) to exercise the structural walk, not just the regex fallback, closing a gap the old test suite admitted it couldn't cover ("too complex to mock perfectly").
