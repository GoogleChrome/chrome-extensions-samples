# Agent Operating Standard

This repository is a mentor-grade learning system. Agents and developers should
optimize for clarity, safety, and transferability.

## Core behavior

- Prefer small, reviewable changes over broad rewrites.
- Validate with `npm run quality:quick` during iteration.
- Validate with `npm run ci:verify` before handoff.
- Preserve sample readability for early-career developers.

## WYNOT framework compliance

For standards that shape implementation and review decisions, consult:

- [docs/wynot/BRAND-VOICE-AND-VISUAL-STYLE.md](docs/wynot/BRAND-VOICE-AND-VISUAL-STYLE.md)
- [docs/wynot/GOVERNANCE-PATHWAY.md](docs/wynot/GOVERNANCE-PATHWAY.md)
- [docs/wynot/ZERO-TRUST-ARCHITECTURE.md](docs/wynot/ZERO-TRUST-ARCHITECTURE.md)
- [docs/wynot/GUARDRAIL-LAYERS-REFERENCE.md](docs/wynot/GUARDRAIL-LAYERS-REFERENCE.md)
- [docs/wynot/MCP-RESOURCES.md](docs/wynot/MCP-RESOURCES.md)
- [docs/wynot/ECOSYSTEM-STACK-BASELINE-2026.md](docs/wynot/ECOSYSTEM-STACK-BASELINE-2026.md)

## Ecosystem dependency defaults

- Use the July 2026 baseline stack as the default decision source.
- Flag any version that diverges from baseline in PR rationale.
- Require migration impact notes for major-version updates.

## Quality and security expectations

- Keep permissions minimal and justified.
- Avoid introducing unverified file paths in manifests.
- Keep tests and validation commands green.
- Document rationale when adding architectural complexity.
- Treat agent-skill permission checks as mandatory security boundaries.

## MCP usage pattern

- Use MCP tools to gather facts before changing governance or architecture.
- Prefer read-only discovery first, write actions second.
- Record policy-impacting decisions in PR descriptions.
- Verify ecosystem dependency guidance against baseline docs before proposing
  framework changes.
- Cross-check handbook requirements using
  [docs/wynot/HANDBOOK-TRACEABILITY-MATRIX.md](docs/wynot/HANDBOOK-TRACEABILITY-MATRIX.md)
  before finalizing implementation plans.
