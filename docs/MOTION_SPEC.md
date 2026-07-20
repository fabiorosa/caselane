# CaseLane motion and pending-state specification

## Purpose

CaseLane already has content-shaped route skeletons and brief interaction
transitions. CL-Q111 adds the missing perceptible motion layer without changing
the approved visual system. Motion must explain loading, navigation, or an
action in progress. It must never exist only as decoration.

This is a post-release quality ticket. It is not a redesign and does not reopen
the V1 product scope.

## Frozen design contract

The restrained dark interface, amber accent, spacing, typography, component
geometry, status colors, and approved PremiumSelect appearance are frozen.

The implementation must not:

- introduce color, radius, shadow, spacing, or typography tokens;
- recolor or resize buttons, selects, menus, rows, chips, or skeletons;
- add gradients beyond the existing skeleton sweep;
- add bounce, elastic, spring, scale-up, glow, parallax, or decorative motion;
- animate layout properties such as width, height, inset, margin, or padding;
- delay navigation or server actions to keep an animation visible;
- add page-specific values when one shared primitive can cover the behavior;
- add an animation dependency;
- convert Server Components to Client Components only for animation;
- use emoji or a generic icon package for pending feedback.

## Motion vocabulary

Use only `transform` and `opacity` for entrance motion. Existing color, border,
background, and shadow transitions may remain where they communicate an
interactive state.

### Resolved route content

When a database-backed route replaces its loading fallback, resolved content
enters once with this exact contract:

- opacity changes from `0` to `1`;
- transform changes from `translateY(5px)` to `translateY(0)`;
- duration is `200ms`;
- easing is `cubic-bezier(0.2, 0.7, 0.2, 1)`;
- cards, rows, metrics, fields, and text are not staggered;
- local state, filtering, focus, hydration, and form revalidation do not replay
  the animation on an already settled page.

Use the smallest shared App Router boundary or presentation primitive that
covers the workspace and Client portal. Do not add the same wrapper to every
page unless framework behavior proves a shared boundary cannot meet the
lifecycle contract.

The skeleton keeps its current geometry and sweep. Skeleton and resolved
content must not overlap, flash blank content, change scroll position, or
increase cumulative layout shift.

### Pending actions

Every existing `useFormStatus` submit control must use one shared pending
indicator contract:

- retain action-specific copy such as `Saving...`, `Sending...`, `Creating...`,
  `Updating...`, `Archiving...`, or `Working...`;
- show one shared inline SVG spinner beside the pending copy;
- set `aria-busy="true"` while pending and keep the control disabled;
- preserve an accessible action name and announce one concise update;
- prevent duplicate submission;
- keep button width and surrounding layout stable;
- use `currentColor` to inherit approved contrast;
- rotate only for the real duration of the action;
- never impose a minimum duration or fake progress.

The spinner must be a shared product primitive, not copied SVG markup. Its
visual size is 14 to 16 pixels, with a restrained stroke and no glow. It must be
legible on amber primary, neutral secondary, and destructive actions.

The inventory covers 14 pending paths across 11 `useFormStatus` consumers:

- authentication and invitation forms;
- one-click demo access;
- client create, edit, contact, and archive actions;
- case intake, details, lifecycle, and message actions;
- Team invitation, profile, role, access, and revoke actions;
- Settings organization and category actions;
- Client portal request and reply actions.

### Existing component transitions

PremiumSelect, the mobile drawer, navigable rows, lifecycle buttons, and message
composer focus already have functional transitions. Preserve their colors,
geometry, keyboard behavior, and focus behavior.

This ticket must not repeat CL-Q108 by allowing a parent button selector to
style PremiumSelect descendants. It must not repeat CL-Q109 by breaking primary
lifecycle action contrast. Do not add exit animation to PremiumSelect because a
delayed unmount can break listbox focus, Escape, and outside-click behavior.

Allowed timing ranges:

- hover, focus, chevron, and press feedback: `120ms` to `180ms`;
- menu or drawer entrance: `140ms` to `200ms`;
- resolved route content: exactly `200ms`.

## Reduced motion

`prefers-reduced-motion: reduce` is a hard requirement:

- remove route entrance transform and opacity animation;
- remove the skeleton sweep;
- stop spinner rotation while keeping its icon and pending text visible;
- make nonessential component transitions effectively instant;
- preserve loading, pending, disabled, focus, success, and error information.

Reduced motion must never hide the pending indicator or make a busy control
look enabled.

## Accessibility and performance

- Motion cannot be the only signal for any state.
- Keyboard behavior, focus order, focus visibility, and focus return cannot
  change.
- Existing route announcements and form notices remain intact.
- Hide the spinner from assistive technology when adjacent text is equivalent.
- Touch targets remain at least 40 pixels on touch layouts.
- Normal text contrast remains at least 4.5:1 in every interactive state.
- Validate desktop and `390px` without horizontal overflow.
- No animation may cause layout shift or change scroll position.
- Do not animate or stagger each record in a list.
- The production bundle gains no third-party runtime dependency.

## Automated coverage

Add preventive tests that prove:

1. The shared resolved-content primitive uses the intended workspace and portal
   route boundaries.
2. Entrance keyframes animate only `opacity` and `transform`.
3. Every current `useFormStatus` submit path uses the shared pending contract or
   an explicitly documented equivalent.
4. Pending controls disable, expose `aria-busy`, retain specific copy, and do
   not duplicate spinner markup.
5. Reduced-motion CSS disables route entrance, skeleton sweep, spinner
   rotation, and nonessential transitions without hiding state information.
6. PremiumSelect descendants cannot inherit filter CTA styling.
7. Primary lifecycle actions retain readable hover contrast.
8. No native product select, emoji, motion dependency, or layout-property
   animation is introduced.

Extend Playwright only where observable behavior cannot be covered reliably at
component level. Do not add arbitrary waits to the E2E suite.

## Real-browser acceptance

Validate the production build on port `3108` with PostgreSQL on `55432`.

With normal motion, observe:

1. a workspace route showing skeleton then resolved content;
2. a Client portal route showing skeleton then resolved content;
3. one fast action and one controlled slow test action, proving pending feedback
   reflects real work rather than a timer;
4. PremiumSelect opening and closing by pointer and keyboard;
5. complete-row hover, focus, and activation without layout movement;
6. desktop and `390px` layouts without horizontal overflow.

Repeat representative route and pending checks with reduced motion emulated.
Content and pending state must remain understandable without nonessential
movement.

Record computed animation names, durations, and animated properties for the
route wrapper, pending indicator, PremiumSelect menu, and a navigable row. DOM
presence alone is not acceptance.

## Completion gate

CL-Q111 is complete only after all of these pass:

- PostgreSQL-backed test suite;
- motion and pending regression tests;
- lint;
- repository secret scan;
- production build;
- existing four Chromium walkthroughs;
- real-browser normal-motion and reduced-motion review on port `3108`;
- `docs/BACKLOG.md`, `docs/TESTING.md`, and `docs/SESSION_STATE.md` updates.

After local acceptance, publish through the existing authorship hook and verify
the deployed Vercel URL. Production behavior must match the local evidence.
