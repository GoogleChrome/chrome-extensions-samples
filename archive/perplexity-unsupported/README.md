# Perplexity support (removed 2026-10-08)

Removed from the active extension, not fixed, because the endpoints it depended on
are gone. Live testing against the real product found **no matching request at
all** for a real search on perplexity.ai -- no REST/SSE call, no GraphQL HTTP
call, nothing `shouldIntercept` could ever match. The page now ships
`threadRelayEnvironment`/`threadLiveUpdates` chunks (Relay, Facebook's GraphQL
client), strongly suggesting Perplexity migrated its thread/query delivery to a
WebSocket subscription sometime after this was last verified working in v1.3.

Properly restoring this requires capturing real wire traffic (a HAR capture or
a WebSocket frame inspector) to learn the current protocol -- don't rewrite
this blind from the old assumptions. See `ROADMAP.md` in the project root for
the full investigation notes from 2026-10-08.

These two files (`perplexity.ts`, `perplexity.test.ts`) are the last working
v2.0-rebuild implementation, kept for reference if/when someone picks this
back up -- not wired into the build, not executed by the test suite.
