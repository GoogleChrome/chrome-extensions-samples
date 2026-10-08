import { describe, expect, it } from "vitest";
import { dbg, dumpDebug, getExtensionVersion, isContextValid } from "./debug";

describe("debug module", () => {
    it("buffers log lines for dump()", () => {
        dbg("info", "test-stage", "hello-marker-123");
        expect(dumpDebug()).toContain("hello-marker-123");
        expect(dumpDebug()).toContain("test-stage");
    });

    it("reports unknown version outside the extension runtime", () => {
        // vitest has no chrome.runtime — must not throw.
        expect(getExtensionVersion()).toBe("unknown");
    });

    it("reports invalid context outside the extension runtime", () => {
        expect(isContextValid()).toBe(false);
    });
});
