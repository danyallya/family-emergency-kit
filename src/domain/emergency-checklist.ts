export const emergencyChecklistItems = [
  {
    id: 'official-guidance',
    label: 'Review current emergency guidance from local authorities.',
  },
  {
    id: 'supplies',
    label: 'Review household supplies using current local public guidance.',
  },
  {
    id: 'family-check-in',
    label: 'Discuss how household members will check in during an outage.',
  },
  {
    id: 'accessibility',
    label: 'Discuss how each household member can receive and act on emergency updates.',
  },
] as const;

export type EmergencyChecklistItemId = (typeof emergencyChecklistItems)[number]['id'];
export type EmergencyChecklistStatus = 'draft' | 'reviewed';

export type EmergencyChecklistItem = {
  id: EmergencyChecklistItemId;
  checked: boolean;
};

export type EmergencyChecklistRecord = {
  schemaVersion: 1;
  id: string;
  status: EmergencyChecklistStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  items: EmergencyChecklistItem[];
};

export type ChecklistError = {
  field: 'id' | 'status' | 'items' | 'updatedAt';
  message: string;
};

export type ChecklistResult =
  | { ok: true; value: EmergencyChecklistRecord }
  | { ok: false; errors: ChecklistError[] };

const allowedTransitions: Record<EmergencyChecklistStatus, readonly EmergencyChecklistStatus[]> = {
  draft: ['reviewed'],
  reviewed: ['draft'],
};

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function exactKeys(value: object, expected: string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === [...expected].sort()[index]);
}

export function createEmergencyChecklist(options: { id: string; now: string }): ChecklistResult {
  const errors: ChecklistError[] = [];
  if (!options.id.trim() || options.id.length > 100) {
    errors.push({ field: 'id', message: 'A local checklist ID of 1–100 characters is required.' });
  }
  if (!isTimestamp(options.now)) {
    errors.push({ field: 'updatedAt', message: 'The checklist time must be a valid ISO timestamp.' });
  }
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      schemaVersion: 1,
      id: options.id,
      status: 'draft',
      createdAt: options.now,
      updatedAt: options.now,
      reviewedAt: null,
      items: emergencyChecklistItems.map(({ id }) => ({ id, checked: false })),
    },
  };
}

export function setChecklistItem(
  record: EmergencyChecklistRecord,
  itemId: EmergencyChecklistItemId,
  checked: boolean,
  at: string,
): ChecklistResult {
  const errors: ChecklistError[] = [];
  if (!isEmergencyChecklistRecord(record)) {
    errors.push({ field: 'items', message: 'The saved checklist is invalid.' });
  }
  if (record.status !== 'draft') {
    errors.push({ field: 'status', message: 'Reopen the reviewed checklist before editing it.' });
  }
  if (!emergencyChecklistItems.some((item) => item.id === itemId)) {
    errors.push({ field: 'items', message: 'Choose a checklist item.' });
  }
  if (!isTimestamp(at) || (isTimestamp(record.updatedAt) && at < record.updatedAt)) {
    errors.push({ field: 'updatedAt', message: 'Checklist changes must use valid chronological times.' });
  }
  if (typeof checked !== 'boolean') {
    errors.push({ field: 'items', message: 'Checklist status must be checked or unchecked.' });
  }
  if (errors.length > 0) return { ok: false, errors };

  const current = record.items.find((item) => item.id === itemId);
  if (!current) return { ok: false, errors: [{ field: 'items', message: 'The checklist item is missing.' }] };
  if (current.checked === checked) return { ok: true, value: record };

  return {
    ok: true,
    value: {
      ...record,
      updatedAt: at,
      items: record.items.map((item) => item.id === itemId ? { ...item, checked } : item),
    },
  };
}

export function transitionChecklist(
  record: EmergencyChecklistRecord,
  nextStatus: EmergencyChecklistStatus,
  at: string,
): ChecklistResult {
  const errors: ChecklistError[] = [];
  if (!isEmergencyChecklistRecord(record)) {
    errors.push({ field: 'items', message: 'The saved checklist is invalid.' });
  }
  if (!allowedTransitions[record.status]?.includes(nextStatus)) {
    errors.push({ field: 'status', message: `Cannot move a ${record.status} checklist to ${nextStatus}.` });
  }
  if (!isTimestamp(at) || (isTimestamp(record.updatedAt) && at < record.updatedAt)) {
    errors.push({ field: 'updatedAt', message: 'Checklist changes must use valid chronological times.' });
  }
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      ...record,
      status: nextStatus,
      updatedAt: at,
      reviewedAt: nextStatus === 'reviewed' ? at : null,
    },
  };
}

export function isEmergencyChecklistRecord(value: unknown): value is EmergencyChecklistRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<EmergencyChecklistRecord>;
  if (
    !exactKeys(value, ['schemaVersion', 'id', 'status', 'createdAt', 'updatedAt', 'reviewedAt', 'items']) ||
    record.schemaVersion !== 1 ||
    typeof record.id !== 'string' ||
    !record.id.trim() ||
    record.id.length > 100 ||
    !['draft', 'reviewed'].includes(record.status ?? '') ||
    !isTimestamp(record.createdAt) ||
    !isTimestamp(record.updatedAt) ||
    Date.parse(record.createdAt) > Date.parse(record.updatedAt) ||
    !Array.isArray(record.items) ||
    record.items.length !== emergencyChecklistItems.length
  ) {
    return false;
  }

  const items = record.items as unknown[];
  for (const [index, item] of items.entries()) {
    if (
      !item ||
      typeof item !== 'object' ||
      !exactKeys(item, ['id', 'checked']) ||
      (item as Partial<EmergencyChecklistItem>).id !== emergencyChecklistItems[index]?.id ||
      typeof (item as Partial<EmergencyChecklistItem>).checked !== 'boolean'
    ) {
      return false;
    }
  }

  if (record.status === 'draft') return record.reviewedAt === null;
  return isTimestamp(record.reviewedAt) && record.reviewedAt === record.updatedAt;
}

export function serializeEmergencyChecklist(record: EmergencyChecklistRecord): string {
  if (!isEmergencyChecklistRecord(record)) throw new Error('Invalid household checklist record.');
  return JSON.stringify(record);
}

export function deserializeEmergencyChecklist(value: string): EmergencyChecklistRecord {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Invalid checklist JSON.');
  }
  if (!isEmergencyChecklistRecord(parsed)) throw new Error('Invalid household checklist record.');
  return parsed;
}

export function exportReviewedChecklist(record: EmergencyChecklistRecord): string {
  if (!isEmergencyChecklistRecord(record) || record.status !== 'reviewed' || typeof record.reviewedAt !== 'string') {
    throw new Error('Review a valid checklist before exporting it.');
  }

  const lines = [
    'Family emergency planning checklist',
    `Reviewed: ${record.reviewedAt.slice(0, 10)}`,
    '',
    'Generic prompts and completion marks only; no personal details are included.',
    '',
    ...record.items.map((item, index) => `${item.checked ? '[x]' : '[ ]'} ${emergencyChecklistItems[index]?.label}`),
    '',
    'Follow current instructions from local emergency authorities.',
  ];
  return lines.join('\n');
}
