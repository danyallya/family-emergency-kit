import { describe, expect, it } from 'vitest';
import {
  createEmergencyChecklist,
  deserializeEmergencyChecklist,
  emergencyChecklistItems,
  exportReviewedChecklist,
  serializeEmergencyChecklist,
  setChecklistItem,
  transitionChecklist,
  type EmergencyChecklistRecord,
} from './emergency-checklist';

const createdAt = '2026-10-28T10:00:00.000Z';
const later = '2026-10-28T10:01:00.000Z';

function createRecord(): EmergencyChecklistRecord {
  const result = createEmergencyChecklist({ id: 'local-checklist-1', now: createdAt });
  if (!result.ok) throw new Error('expected valid checklist');
  return result.value;
}

describe('emergency checklist validation and lifecycle', () => {
  it('creates only fixed, non-identifying prompts with a valid local timestamp', () => {
    const record = createRecord();
    expect(record.status).toBe('draft');
    expect(record.items).toHaveLength(emergencyChecklistItems.length);
    expect(record.items.every((item) => !item.checked)).toBe(true);
    expect(record).not.toHaveProperty('name');
    expect(record).not.toHaveProperty('address');
    expect(record).not.toHaveProperty('contact');
    expect(record).not.toHaveProperty('medicalDetails');
    expect(createEmergencyChecklist({ id: ' ', now: createdAt }).ok).toBe(false);
    expect(createEmergencyChecklist({ id: 'local-1', now: 'not-a-time' }).ok).toBe(false);
  });

  it('updates a prompt and enforces chronological edit boundaries', () => {
    const record = createRecord();
    const item = emergencyChecklistItems[0];
    const changed = setChecklistItem(record, item.id, true, later);
    expect(changed.ok).toBe(true);
    if (!changed.ok) return;
    expect(changed.value.items[0]?.checked).toBe(true);
    expect(changed.value.updatedAt).toBe(later);
    expect(setChecklistItem(changed.value, item.id, false, createdAt).ok).toBe(false);
    expect(setChecklistItem(changed.value, item.id, true, later).ok).toBe(true);
  });

  it('rejects unknown prompts and malformed checked values', () => {
    const record = createRecord();
    expect(setChecklistItem(record, 'address' as never, true, later).ok).toBe(false);
    expect(setChecklistItem(record, emergencyChecklistItems[0].id, 'yes' as never, later).ok).toBe(false);
  });

  it('reviews and reopens a checklist without treating review as proof of readiness', () => {
    const record = createRecord();
    const reviewed = transitionChecklist(record, 'reviewed', later);
    expect(reviewed.ok).toBe(true);
    if (!reviewed.ok) return;
    expect(reviewed.value.reviewedAt).toBe(later);
    expect(setChecklistItem(reviewed.value, emergencyChecklistItems[0].id, true, later).ok).toBe(false);
    expect(transitionChecklist(reviewed.value, 'reviewed', later).ok).toBe(false);
    const reopened = transitionChecklist(reviewed.value, 'draft', '2026-10-28T10:02:00.000Z');
    expect(reopened.ok).toBe(true);
    if (reopened.ok) expect(reopened.value.reviewedAt).toBeNull();
  });

  it('exports only a reviewed generic checklist with checked states and no personal fields', () => {
    const record = createRecord();
    expect(() => exportReviewedChecklist(record)).toThrow('Review a valid checklist');
    const checked = setChecklistItem(record, emergencyChecklistItems[0].id, true, later);
    if (!checked.ok) throw new Error('expected valid checklist item update');
    const reviewed = transitionChecklist(checked.value, 'reviewed', '2026-10-28T10:02:00.000Z');
    if (!reviewed.ok) throw new Error('expected valid review');
    const exported = exportReviewedChecklist(reviewed.value);
    expect(exported).toContain('[x] Review current emergency guidance from local authorities.');
    expect(exported).toContain('no personal details are included');
    expect(exported).not.toContain(record.id);
    expect(exported).not.toMatch(/\b(?:address|phone number|medical details)\b/i);
  });

  it('round-trips serialization and rejects malformed structure, ordering and injected fields', () => {
    const record = createRecord();
    expect(deserializeEmergencyChecklist(serializeEmergencyChecklist(record))).toEqual(record);
    expect(() => deserializeEmergencyChecklist('{')).toThrow('Invalid checklist JSON');
    expect(() => deserializeEmergencyChecklist('{"id":"unknown"}')).toThrow('Invalid household checklist');
    const duplicateItem = { ...record, items: [record.items[0], record.items[0], ...record.items.slice(2)] };
    expect(() => serializeEmergencyChecklist(duplicateItem)).toThrow('Invalid household checklist');
    const injectedField = { ...record, contact: 'someone@example.test' };
    expect(() => serializeEmergencyChecklist(injectedField)).toThrow('Invalid household checklist');
    const futureReview = { ...record, status: 'reviewed' as const, reviewedAt: later };
    expect(() => serializeEmergencyChecklist(futureReview)).toThrow('Invalid household checklist');
  });
});
