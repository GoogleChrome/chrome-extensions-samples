/**
 * Structured diagnostics for AI Search Revealer.
 *
 * Every content-script stage logs through here so a pasted console tells us
 * exactly where init stopped. Logs are also kept in a ring buffer exposed via
 * `window.__AI_SEARCH_REVEALER__.dump()` for post-mortem inspection.
 */

export type DebugLevel = "info" | "warn" | "error";

const BUFFER_LIMIT = 200;
const buffer: string[] = [];

function timestamp(): string {
    try {
        return new Date().toISOString().slice(11, 23);
    } catch {
        return "??:??:??";
    }
}

export function dbg(level: DebugLevel, stage: string, ...args: unknown[]): void {
    const line = `[${timestamp()}] [${stage}] ${args.map((a) => {
        try {
            return typeof a === "string" ? a : JSON.stringify(a);
        } catch {
            return String(a);
        }
    }).join(" ")}`;
    buffer.push(`${level.toUpperCase()} ${line}`);
    if (buffer.length > BUFFER_LIMIT) buffer.splice(0, buffer.length - BUFFER_LIMIT);
    try {
        // eslint-disable-next-line no-console
        console[level === "info" ? "log" : level](
            `%c[AI Search Revealer]%c ${line}`,
            "color:#00f2fe;font-weight:bold",
            "color:inherit",
        );
    } catch {
        // Console unavailable — buffer still holds the line.
    }
}

export function dumpDebug(): string {
    return buffer.join("\n");
}

/** Extension version from the live manifest (proves which build is running). */
export function getExtensionVersion(): string {
    try {
        const g = globalThis as unknown as { chrome?: { runtime?: { getManifest?: () => { version?: string } } } };
        return g.chrome?.runtime?.getManifest?.()?.version ?? "unknown";
    } catch {
        return "unknown";
    }
}

/**
 * False when the content script outlived an extension reload/update.
 * In that state EVERY chrome.* call fails and the only fix is a tab refresh.
 */
export function isContextValid(): boolean {
    try {
        const g = globalThis as unknown as { chrome?: { runtime?: { id?: string } } };
        return !!g.chrome?.runtime?.id;
    } catch {
        return false;
    }
}
