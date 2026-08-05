# Brand Voice and Visual Style

This file is the implementation-facing contract for WYNOT brand and interface
standards used in ecosystem repositories.

## Voice contract

- Teach first: explain intent before implementation details.
- Be direct: avoid vague language and hidden assumptions.
- Be accountable: list what was validated and what remains unverified.

## AEO language guardrails

- Start authority pages with BLUF-style entity definition before narrative.
- Use question-based section headings for retrieval alignment.
- Minimize pronouns when factual entity naming improves clarity.
- Avoid marketing buzzwords when factual language is available.
- Write each section as a standalone extractable unit.

## UI and code style expectations

- Keep naming explicit and domain-relevant.
- Prefer accessibility and readability over novelty.
- Avoid visual ambiguity in sample UI labels and interactions.

## Integration notes

When you add the official WYNOT handbooks, map their sections here:

- Tone and language rules
- Visual hierarchy rules
- Design token and CSS system rules
- Accessibility and responsiveness rules

Map ecosystem design-system constraints to this module when available:

- `tailwind.config.js` policy or Tailwind 4 CSS-first equivalents
- `wynot-global.css` standards and token usage policy
- Component-level accessibility style contracts

## PR checklist additions

- Voice and UX language are consistent with handbook rules.
- Any style token changes are documented and justified.
