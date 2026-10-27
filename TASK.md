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

Not started. Use resilience/001-emergency-plan. After acceptance passes, update progress and set the next task.
