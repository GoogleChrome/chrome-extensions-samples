# Guardrail Layers Reference

This document captures the zero-trust guardrail model used in WYNOT ecosystem
repos where agent skills are governed through explicit permission checks.

## Core model

- A skills registry is the source of truth for callable skills.
- Each skill record defines ownership, risk classification, and lifecycle state.
- Every invocation path must verify permission before skill execution.

## Canonical skill fields

The registry contract should include at least:

- `id`: stable skill identifier, for example `SKL-PII-001`
- `name`: human-readable skill label
- `owningAgent`: agent permitted to execute the skill by default
- `guardrailLevel`: policy severity tier used for enforcement
- `status`: lifecycle state such as active, deprecated, or blocked

## Permission contract

The permission verifier should answer one question deterministically:

Is the requesting agent authorized to execute the target skill in this context?

Recommended shape:

- Function name: `verifyAgentPermission()`
- Inputs: `agentId`, `skillId`, optional context metadata
- Output: explicit allow or deny result, plus reason for auditability

## Guardrail layers

1. Registry layer
   All skills are registered and typed before use.
2. Ownership layer
   Runtime checks enforce skill-to-agent ownership.
3. Risk layer
   `guardrailLevel` gates high-risk skills with stronger controls.
4. Status layer
   `status` blocks deprecated or disabled skills.
5. Audit layer
   Denials and policy overrides are logged for review.
6. Authority layer
   Human leadership, compliance, and legal decisions cannot be overridden by
   AI agents.

## Integration notes

If test suites or portals depend on registry fields, keep the shared type schema
in sync first, then update call sites. This avoids iterative compile failures
where consumers expect fields that the registry schema does not expose yet.

## WYNOT adoption checklist

- Skills registry defines the canonical fields above.
- Permission checks run before every skill invocation.
- High-risk skills are assigned non-default guardrail levels.
- Denied invocations include an actionable reason.
- Schema updates are validated against tests and portal contracts.
- Active compliance holds block execution even when a growth agent proposes
  changes.
- Connector access is explicit, role-scoped, and least privilege by default.
