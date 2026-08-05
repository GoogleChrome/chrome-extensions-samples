# WYNOT Web Department SOP v1.0 (2026)

This file captures enforceable web engineering and launch controls from the
WYNOT web lifecycle manual.

## Lifecycle governance

- Eight gated phases: discovery, IA, wireframes, visual design, backend,
  frontend, QA/launch, post-launch monitoring.
- No phase advances without explicit gate sign-off.
- Tribe liaison participation is mandatory across major review points.

## Accessibility and UX controls

- WCAG 2.2 AA target with explicit checks for focus, target size, redundant
  entry, and accessible authentication.
- Mobile thumb-zone-first interaction model.
- Keyboard and screen-reader walkthroughs required before launch.

## Performance controls

- Core Web Vitals 2026 targets for LCP, INP, CLS, and TTFB.
- Asset optimization, lazy loading, and script deferral required.
- Pre-launch performance evidence must include Lighthouse and WebPageTest.

## Security controls

- OWASP Top 10 (2025) aligned controls for access, cryptography, injection,
  misconfiguration, dependency risk, and monitoring.
- Server-side validation with typed schemas required for all form endpoints.
- Youth-data controls include consent capture and retention safeguards.

## AI/SEO/AEO controls

- Structured data and entity-consistent naming required.
- Organization and page-type schema coverage required.
- Site metadata and sitemap hygiene required for discoverability.

## Implementation notes for this repo

- Map these controls into
  [../ZERO-TRUST-ARCHITECTURE.md](../ZERO-TRUST-ARCHITECTURE.md) and
  [../MCP-RESOURCES.md](../MCP-RESOURCES.md).
