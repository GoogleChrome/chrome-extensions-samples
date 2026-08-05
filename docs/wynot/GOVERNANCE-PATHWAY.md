# Governance Pathway

This document maps contributor decisions to the WYNOT BrandBrain Tree Network
governance pathway.

## Decision classes

- Content decision: docs, examples, and teaching sequence.
- Interface decision: labels, flows, and visual structure.
- Architecture decision: dependency, security, and runtime boundaries.
- Automation decision: CI, checks, and release-impacting workflows.
- Stack decision: framework and package baseline changes.
- Guardrail decision: agent-skill permissions and risk-tier enforcement.

## Governance checkpoints

1. Identify impacted decision class.
2. Record expected learner or developer impact.
3. Validate stack compatibility against
   [ECOSYSTEM-STACK-BASELINE-2026.md](ECOSYSTEM-STACK-BASELINE-2026.md).
4. Validate guardrail model impacts against
   [GUARDRAIL-LAYERS-REFERENCE.md](GUARDRAIL-LAYERS-REFERENCE.md).
5. Validate through the quality gate.
6. Capture residual risks in the PR.

## Review protocol

- Require at least one reviewer to confirm governance alignment.
- Require updated rationale when a change affects shared standards.
