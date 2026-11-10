# Security and data policy

- Collect the minimum data; treat user content as private by default.
- No authentication, authorization, encryption-at-rest or production backup policy exists yet. Do not enter real sensitive data.
- Keep secrets in untracked .env; never expose DB/provider keys to browsers.
- Never cache APIs, authenticated pages or personal records in the service worker.
- Define export, deletion, retention, access logs and incident response before launch.
- Domain guardrail: Sensitive location and contact data need local protection, recovery and safe sharing.
- Review threat model, roles and offline-device recovery before launch.
- The current prototype stores only fixed prompt IDs and completion marks in browser IndexedDB without application-level encryption, access control, backup or recovery. Do not enter names, contact details, addresses, meeting places, health details or document contents. Plain-text exports must be inspected before sharing. Deletion is limited to the local object store; browser backups and secure erasure are not guaranteed.
