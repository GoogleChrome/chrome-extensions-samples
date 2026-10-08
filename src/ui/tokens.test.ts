import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Regression test for a live bug found during the v2.0 manual verification
 * pass: tokens.css defined its custom properties on `:root`, but this
 * stylesheet is always injected inside a Shadow Root (see ui/mount.ts).
 * `:root` only ever matches the *document's* root element -- never a shadow
 * root -- so every `var(--csr-*)` in the shadow tree silently resolved to
 * nothing, and `.csr-container`'s `background: var(--csr-surface-1)` computed
 * to fully transparent, letting the host page's own text show through.
 * `:host` is the correct, shadow-tree-scoped equivalent of `:root`.
 *
 * This can't be verified by rendering (jsdom doesn't implement real Shadow
 * DOM style scoping/custom-property resolution), so it's checked statically
 * against the source text instead.
 */
describe("tokens.css is scoped correctly for Shadow DOM", () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "tokens.css"), "utf-8");

    it("defines its custom properties on :host, not :root", () => {
        expect(css).toMatch(/:host\s*{/);
        expect(css).not.toMatch(/:root\s*{/);
    });
});
