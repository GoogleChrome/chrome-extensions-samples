# WYNOT Ecosystem Stack Baseline (July 2026)

This baseline is the default stack contract for WYNOT ecosystem web and app
repositories. Use it for architecture decisions, agent implementation defaults,
and dependency governance reviews.

## Verified current versions

| Package                   | Current      | Notes                                 |
| ------------------------- | ------------ | ------------------------------------- |
| Next.js                   | 16.2.x       | Major breaking release                |
| React                     | 19.2.x       | Compiler stable, Actions              |
| Motion (ex-Framer Motion) | 12.x         | Rebranded to `motion`                 |
| Tailwind CSS              | 4.x          | CSS-first config, no config file      |
| shadcn CLI                | 4.x          | Agent-friendly, Base UI default       |
| GSAP                      | 3.15.x       | 100% free, all plugins                |
| React Three Fiber         | 9.x          | React 19 compatible                   |
| Supabase JS               | 2.110.x      | -                                     |
| Stripe SDK                | 22.x         | -                                     |
| Zod                       | 4.x          | Performance rewrite                   |
| Drizzle / Prisma          | 0.45.x / 7.x | Drizzle is the default recommendation |

## Implementation defaults

- Default rendering stack: Next.js 16 + React 19.
- Default schema validation: Zod 4.
- Default data layer: Drizzle unless a project constraint requires Prisma.
- Default animation engine: Motion 12; use GSAP when timeline complexity or
  plugin-based animation is required.
- Default utility styling: Tailwind 4 CSS-first approach.

## Compatibility guardrails

- Do not introduce React 18-era compatibility dependencies in new code.
- Do not add Tailwind legacy config patterns in new repos.
- For R3F usage, require 9.x+ in React 19 projects.
- Require explicit migration notes when upgrading any baseline major version.

## Governance requirements for stack changes

When proposing changes to this baseline:

1. Document migration impact on current WYNOT repos.
2. Document zero-trust and supply-chain implications.
3. Link upstream release notes and compatibility evidence.
4. Add an adoption plan and rollback strategy.
