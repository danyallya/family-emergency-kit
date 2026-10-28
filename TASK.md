# Active task

**ID:** EMERGENCY-PLAN-001  
**Title:** Create an offline checklist export that family members can review.

## Context

The technical shell exists; the product workflow does not. Build the first safe, end-to-end domain slice for Family Emergency Kit.

## Acceptance criteria

- Type the checklists domain record, validation rules and lifecycle.
- Add a create/review flow that works without a server round-trip.
- Persist a draft with Dexie and show saved, unsaved and sync state truthfully.
- Test valid/invalid input, date/order boundaries and serialization.
- Document retention, deletion and limitations of the offline slice.
- Respect this guardrail: Sensitive location and contact data need local protection, recovery and safe sharing.

## Status

Complete for the generic offline starter slice: fixed household planning prompts are stored locally, can be discussed and marked reviewed, and can be exported as plain text. The record has no free-text, contact, location, meeting-place, medical or document fields. It is not safe for real sensitive emergency details because browser storage has no application-level protection or recovery.

Next: EMERGENCY-PLAN-003 PostgreSQL migrations and repository tests for generic checklist metadata only. Keep contacts, precise locations and other sensitive household records gated until local protection, recovery and safe-sharing requirements are designed and reviewed.
