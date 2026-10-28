# Architecture

- Web: Next.js App Router and server-only route handlers.
- UI: React, Tailwind CSS, React Icons, semantic HTML and explicit status.
- Offline: service worker for public shell; Dexie v2 stores one generic checklist with fixed prompts and completion marks. No free-text or sensitive emergency fields are stored.
- Database: PostgreSQL 18 in Compose; ordered SQL migrations under db/migrations.
- Domain belongs in src/domain; server access in src/server; view code in app.
- External providers use server-side adapters and environment-only secrets.
- Docker multi-stage build; isolated web/database services per project.

First product record: a generic household checklist in IndexedDB. The reviewed export contains only fixed prompts and checked states. PostgreSQL mapping, sync and sensitive contacts/locations are not implemented; design local protection, recovery and safe sharing before storing them.
