# Zero-Trust Architecture Build

This repository applies zero-trust principles to sample quality and automation.

## Build principles

- Least privilege: request only required capabilities and permissions.
- Explicit validation: verify every manifest and quality gate signal.
- Assume drift: enforce formatting and policy checks continuously.
- Contain blast radius: use incremental rollout for broad policy changes.
- Harden supply chain: use verified dependency baselines and tracked upgrades.

## Implementation controls in this repo

- CI checks must pass through `npm run ci:verify`.
- Manifest validation checks required keys and referenced files.
- Workflow permissions are minimized and stale runs are canceled.
- Ecosystem dependencies are governed by an explicit baseline contract.

See:

- [ECOSYSTEM-STACK-BASELINE-2026.md](ECOSYSTEM-STACK-BASELINE-2026.md)
- [GUARDRAIL-LAYERS-REFERENCE.md](GUARDRAIL-LAYERS-REFERENCE.md)

## Guardrail model requirements

For agentic repos in the WYNOT ecosystem, use a skills registry and explicit
permission verifier as first-class controls.

Expected controls:

- Registry schema includes ownership, guardrail tier, and lifecycle status.
- Permission checks run before every skill invocation.
- Enforcement and denial reasons are auditable.

## Extension points

Future controls to add when needed:

- Signed artifact verification for generated build outputs.
- Policy-as-code checks for permissions and host access patterns.
- Change-impact scoring for high-risk samples.
- Automated dependency drift alerts against the WYNOT stack baseline.
