# SKILLS.md

Recipes for extending this codebase. Pairs with [AGENTS.md](AGENTS.md) (conventions/rules) and [ARCHITECTURE.md](ARCHITECTURE.md) (why it's shaped this way).

## Add a new AI platform

1. **Add the type contract.** Nothing to do here -- `src/platforms/types.ts`'s `IPlatformExtractor` (`name`, `shouldIntercept(url)`, `extract(text)`) is already platform-agnostic.
2. **Write `src/platforms/<name>.ts`.** Decide how much of the toolkit you need:
   - If the vendor streams newline-delimited JSON (SSE-like): use `frameSse(text)` to get `Frame[]`, then `walkJson(frame.json, visitor)` per frame.
   - If the vendor has its own transport envelope (like Gemini's `batchexecute`): write a small framing function next to `frameSse`/`frameBatchExecute` in `src/core/extract/frame.ts` if it's likely reusable, or keep it local to your platform file if it's genuinely one-off.
   - If the response shape is simple and fixed (like Claude's `chat_messages[].content[]`): direct property access is fine. Don't force a `walkJson` visitor onto a shape that doesn't need recursion.
   - Build a `SourceMap` for any cited/retrieved sources; call `.values()` once at the end and attach it via `registry.setSources(...)` (the convention every current platform with sources follows: one list, shared by every query in the response -- see ARCHITECTURE.md if you think your platform needs different scoping, and flag it explicitly rather than silently deviating).
   - Use `QueryRegistry` to accumulate queries + per-query metadata (engine/intent/model/turn-id) if your platform has any; otherwise a plain `Set<string>` is fine (see `claude.ts`).
   - Add a `regexFallback` layer for truncated/partial streaming chunks, using `RegexRule[]` with a `reject()` guard for any "don't match inside this block" exclusion (see `rejectNearKeywords` and its usage example in `src/core/extract/regex.test.ts`).
3. **Write `src/platforms/<name>.test.ts`.** Cover: `shouldIntercept` URL matching (positive and negative cases), the main structural extraction path, the regex fallback path, and source extraction if applicable. Construct realistic payloads by hand if you don't have real captured traffic -- but say so in a comment, the way `gemini.test.ts` does.
4. **Wire it into `src/interceptor.ts`'s `PLATFORMS` array.**
5. **Add the platform's origin(s) to `public/manifest.json`'s `content_scripts.matches`** (both the MAIN-world interceptor entry and the ISOLATED-world content entry), and to `README.md`'s platform table.
6. **Add a brand color** to `src/ui/tokens.css` (`--clr-<platform>` / `--clr-<platform>-bg`) in the same desaturated loudness band as the existing three, and a corresponding `.platform-<name>` rule in `src/ui/components.css`.
7. Run `npm run check && npm test && npm run build`.

## Add a UI component

- Components live in `src/ui/components/`, one per file, PascalCase. Import signals directly from `src/store/captures.ts` and read `.value` during render -- no prop drilling needed for anything that's genuinely global state (filters, captured queries, enabled/collapsed). Use props for anything reusable/generic (see `FilterSelect`, `SourceChip`, `MetaTag` -- they take explicit props and have zero store coupling, so they're trivially reusable and testable in isolation).
- Local component state (e.g. a transient copy-feedback flag) uses `useState` from `preact/hooks` -- don't promote it into the store unless another component actually needs to read it.
- Style via existing classes in `src/ui/components.css` plus tokens in `src/ui/tokens.css`. Add new tokens there rather than hardcoding colors/spacing in a component file.
- If the component needs a sound effect for a transient state change that should reach screen readers too, call `announce("...")` from `src/store/captures.ts` -- don't add a second live region.

## Add an export format

`src/ui/export.ts` holds the pure builder functions (`buildCsv`, `buildMarkdown`). To add a new one:

1. Write `buildX(queries: CapturedQuery[]): string` as a pure function, no DOM access.
2. Add a test in `src/ui/export.test.ts`.
3. Wire a button into `src/ui/components/ExportMenu.tsx` calling `download(doc, win, filename, mime, buildX(filteredQueries.value))`.
4. If the format can embed user-influenced text into something another program might interpret as code (the way CSV cells starting with `=`/`+`/`-`/`@` can be read as formulas by Excel/Sheets), neutralize that explicitly and add a regression test -- see `csvCell`'s `FORMULA_TRIGGER` handling as the precedent.

## Add a new signal to the store

- Add it to `src/store/captures.ts`, export it, and add a test in `src/store/captures.test.ts`.
- If it needs to persist across sessions (not just across collapse/expand within one page load), it belongs in `src/store/persistence.ts`'s `PersistedSchemaV1` instead -- bump `SCHEMA_VERSION` in `src/core/types.ts` and write a migration in `readState()`, the same way the v1.3 -> v1 schema migration works today.

## Regenerate the store-readiness docs

Whenever `public/manifest.json`'s permissions, `host_permissions`, or data collection behavior change, update **both** `CHROMEWEBSTORE.md` (the permissions-justification table and privacy/data-use section) and `PRIVACY_POLICY.md` in the same change. A mismatch between the two is a common Chrome Web Store rejection reason.
