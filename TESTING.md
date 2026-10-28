# Test strategy

- Unit: checklist record shape, fixed item IDs, lifecycle transitions, chronology and export serialization.
- Component: accessible labels, keyboard flow, saved/unsaved state, empty/error/deletion states.
- Integration: PostgreSQL migrations, repository behavior and offline recovery.
- End-to-end: create, review, download, reload and delete while offline.
- Release gate: typecheck, lint, unit tests and production build via `npm run verify`.

## Current automated coverage

`npm run verify` checks type safety, unit tests, lint and a production build. Unit tests cover a non-identifying checklist, checked-state updates, chronological boundaries, review/reopen, export gating and strict JSON serialization. Browser IndexedDB persistence, keyboard/screen-reader behavior, download behavior, PostgreSQL migrations and offline reconnection are not automated yet.

## Manual acceptance

Create and review the generic checklist, download and inspect the text, reload the page, delete the local record and verify the empty state. Check keyboard navigation and screen-reader labels. Do not use real names, contacts, addresses, meeting places, health details or document contents.
