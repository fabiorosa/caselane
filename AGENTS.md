# CaseLane agent contract

Read `docs/PRODUCT.md`, `docs/SCOPE.md`, `docs/ARCHITECTURE.md`,
`docs/AUTHORIZATION.md`, `docs/CONTRACTS.md`, `docs/UI_SPEC.md`,
`docs/BACKLOG.md`, `docs/TESTING.md`, `docs/ROADMAP.md`, and
`docs/SESSION_STATE.md` before changing the product.

Work on exactly one `BACKLOG.md` ticket at a time. Do not begin the next
milestone before its review gate is satisfied. Update ticket status and
`SESSION_STATE.md` before ending the session.

## Product rules

- CaseLane is a public portfolio product, not a prototype or a tutorial clone.
- Finish the active vertical slice before starting another.
- Reduce scope instead of shipping incomplete states.
- Do not expose or reuse concepts, data, or code from Fabio's private products.
- Public product copy and documentation are written in natural US English.
- Never invent customers, testimonials, usage metrics, or business outcomes.

## Engineering rules

- TypeScript strict mode; do not use `any` as an escape hatch.
- PostgreSQL is the source of truth for product data.
- Every tenant-owned query must be scoped by `organizationId` server-side.
- Authorization is enforced on the server, never only in the UI.
- Schema changes require migrations.
- Critical workflows require automated tests.
- Keep API validation and domain rules outside visual components.
- Record material architectural decisions in `docs/DECISIONS.md`.
- Update `docs/SESSION_STATE.md` before ending a work session.

## Design rules

- Dark premium application shell, restrained neutrals, one amber accent.
- Generous spacing and hierarchy through scale and weight.
- Complete loading, empty, error, disabled, hover, focus, and active states.
- No emoji, decorative gradients, glassmorphism, fake metrics, or generic copy.
- Minimum body text is 14px; normal text contrast is at least 4.5:1.
- Prefer purposeful icons and avoid identical card grids.

## Definition of done

A feature is complete only when the happy path, validation, authorization,
empty state, error state, tests, and documentation are complete and the
production build passes.
