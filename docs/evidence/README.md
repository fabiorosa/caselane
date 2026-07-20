# Release evidence

These assets are generated from the deterministic Orbit Labs demo on the real
Next.js application at a 1440 x 900 desktop viewport and a 390 x 844 mobile
viewport.

- `01-demo-access.png`: public 50/50 sign-in and role chooser.
- `02-operational-overview.png`: live PostgreSQL aggregates and recent activity.
- `03-overdue-queue.png`: overview metric resolved to its filtered work queue.
- `04-settings.png`: organization identity and category management.
- `05-client-portal-mobile.png`: client-owned request list on mobile.
- `caselane-owner-walkthrough.webm`: Owner path from overview to overdue work and
  settings.

Regenerate the set with `npm run evidence:capture` while the deterministic demo
is running on port 3108. Review every asset before publishing; evidence must show
fictional data only.
