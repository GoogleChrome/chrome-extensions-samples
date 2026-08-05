# MCP Resources and Workflow

This file defines how to use Model Context Protocol resources for a mentor-grade
repository workflow.

## MCP resource classes

- Repository discovery: structure, file, and symbol lookup.
- Governance and PR management: review context and status checks.
- Documentation retrieval: external standards and API references.
- Ecosystem baselines: dependency and architecture constraints.

## Recommended operating flow

1. Discover context with read-only MCP tools.
2. Validate assumptions against source files and workflow config.
3. Apply minimal code or docs changes.
4. Re-run quality checks.
5. Report findings with explicit file references.

## Minimum evidence for policy or architecture changes

- Affected files and rationale captured in PR.
- Validation output from `npm run ci:verify`.
- Governance and zero-trust impact note.
- Baseline stack compatibility note.
- Guardrail-model impact note for agent-skill changes.
- Connector access-impact note for integrations.

## WYNOT handbook integration

When official handbooks are available, add links and references here:

- Brand voice handbook
- Visual style handbook
- Developer and agent behavior handbook
- BrandBrain governance handbook
- Zero-trust build handbook

## Stack verification workflow

When implementation involves frameworks or platform dependencies:

1. Check [ECOSYSTEM-STACK-BASELINE-2026.md](ECOSYSTEM-STACK-BASELINE-2026.md).
2. Verify upstream package status and migration notes.
3. Record compatibility decisions in PR summary.
4. If divergence is needed, link governance rationale and rollback plan.

## Guardrail verification workflow

When implementation touches agent skills, portals, or runtime policy checks:

1. Validate field compatibility against
   [GUARDRAIL-LAYERS-REFERENCE.md](GUARDRAIL-LAYERS-REFERENCE.md).
2. Confirm permission checks run before skill execution.
3. Confirm deny paths are testable and auditable.

## Integration permission baseline

For WYNOT Global SuperAgent-style systems, apply controlled integration access:

- Default read-only for Google Drive, Google Docs, GA4, and Search Console.
- Do not enable Gmail, Contacts API, or Admin SDK until a formal risk review is
  approved.
- Add Calendar access only when scheduling automation is explicitly scoped,
  reviewed, and approved.
- Record which role can trigger each connector action before deployment.

## AEO publishing workflow

When creating high-authority About pages and entity definitions:

1. Use BLUF structure in the opening section with legal entity, audience,
   product, and location facts.
2. Use question-based H2/H3 headings aligned to search intent.
3. Ground claims with verifiable evidence (founders, dates, credentials,
   compliance, or measured outputs).
4. Keep paragraph blocks standalone so AI systems can quote each section
   independently.

## Competitive intelligence workflow

When strategy or market-positioning docs are updated:

1. Log benchmark source and why it matters for WYNOT positioning.
2. Map the finding to an action queue owner and due date.
3. Distinguish enterprise benchmark behavior from startup-friendly WYNOT
   adoption path.
4. Add monthly review cadence and dashboard signals before proposing new tool
   spend.
