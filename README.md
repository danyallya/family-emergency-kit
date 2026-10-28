# Family Emergency Kit

An offline family plan for contacts, meeting places, supplies and accessible member copies.

Keep emergency checklist and contacts available during an outage.

> Status: generic local checklist prototype. It stores fixed planning prompts and checked states in this browser; it does not store contacts, locations, medical details or other personal emergency records. Exports are plain text.

## Start locally

- Node.js 24 LTS and Docker Desktop with Compose.
- Copy .env.example to .env and set a development password.
- Install with `npm ci`.
- Start with docker compose up --build.
- App: http://localhost:3110 · PostgreSQL: localhost:5550

For lower-bandwidth installs, use [Offline Dev Vault](https://github.com/danyallya/offline-dev-vault); see docs/DEPENDENCIES.md.

## Foundation

Next.js App Router, TypeScript, React, Tailwind CSS, React Icons, PostgreSQL, Docker Compose, PWA manifest, conservative offline shell, Dexie v2 checklist drafts, health endpoint, unit tests and CI. English interface.

The service worker caches only the public shell and versioned static files. It does not cache API responses or checklist records. Local IndexedDB data has no application-level encryption, sync or backup. Do not enter sensitive details; delete a checklist in the app or clear the browser profile. Browser backups and secure erasure are outside the prototype's guarantee.

Read AGENTS.md, TASK.md and docs/PROGRESS.md before work.
