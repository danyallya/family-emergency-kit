'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuBookOpenCheck, LuDownload, LuShieldCheck, LuTrash2, LuWifiOff } from 'react-icons/lu';
import { localDatabase } from '@/client-db';
import {
  createEmergencyChecklist,
  emergencyChecklistItems,
  exportReviewedChecklist,
  isEmergencyChecklistRecord,
  setChecklistItem,
  transitionChecklist,
  type EmergencyChecklistItemId,
  type EmergencyChecklistRecord,
} from '@/domain/emergency-checklist';
import { projectInfo } from '@/project-info';

const localChecklistId = 'household-checklist';

function saveMessage(state: 'idle' | 'unsaved' | 'saved' | 'error'): string {
  if (state === 'unsaved') return 'Saving on this device…';
  if (state === 'saved') return 'Saved in this browser only. Nothing is synced or shared.';
  if (state === 'error') return 'Could not save this checklist on the device. Your changes may be unsaved.';
  return 'No checklist changes are waiting to be saved.';
}

export default function HomePage() {
  const [checklist, setChecklist] = useState<EmergencyChecklistRecord | null>(null);
  const [storageState, setStorageState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saveState, setSaveState] = useState<'idle' | 'unsaved' | 'saved' | 'error'>('idle');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadChecklist = useCallback(async () => {
    setStorageState('loading');
    setActionError('');
    try {
      const saved = await localDatabase.emergencyChecklists.get(localChecklistId);
      if (saved && !isEmergencyChecklistRecord(saved)) throw new Error('Invalid stored checklist.');
      setChecklist(saved ?? null);
      setStorageState('ready');
      setSaveState(saved ? 'saved' : 'idle');
    } catch {
      setChecklist(null);
      setStorageState('error');
    }
  }, []);

  useEffect(() => {
    let active = true;
    localDatabase.emergencyChecklists.get(localChecklistId)
      .then((saved) => {
        if (!active) return;
        if (saved && !isEmergencyChecklistRecord(saved)) throw new Error('Invalid stored checklist.');
        setChecklist(saved ?? null);
        setStorageState('ready');
        setSaveState(saved ? 'saved' : 'idle');
      })
      .catch(() => {
        if (active) {
          setChecklist(null);
          setStorageState('error');
        }
      });
    return () => { active = false; };
  }, []);

  async function createChecklist() {
    setActionError('');
    const result = createEmergencyChecklist({ id: localChecklistId, now: new Date().toISOString() });
    if (!result.ok) {
      setActionError(result.errors[0]?.message ?? 'Could not create this checklist.');
      return;
    }
    setBusy(true);
    setChecklist(result.value);
    setSaveState('unsaved');
    try {
      await localDatabase.emergencyChecklists.add(result.value);
      setSaveState('saved');
    } catch {
      setChecklist(null);
      setSaveState('error');
      setActionError('Could not create the checklist in this browser. Try again or close other tabs using it.');
    } finally {
      setBusy(false);
    }
  }

  async function changeItem(itemId: EmergencyChecklistItemId, checked: boolean) {
    if (!checklist || busy) return;
    setActionError('');
    const result = setChecklistItem(checklist, itemId, checked, new Date().toISOString());
    if (!result.ok) {
      setActionError(result.errors[0]?.message ?? 'Could not update this prompt.');
      return;
    }
    setBusy(true);
    setChecklist(result.value);
    setSaveState('unsaved');
    try {
      await localDatabase.emergencyChecklists.put(result.value);
      setSaveState('saved');
    } catch {
      setChecklist(checklist);
      setSaveState('error');
      setActionError('Could not save the updated checklist. The earlier saved version is still in this browser.');
    } finally {
      setBusy(false);
    }
  }

  async function changeReviewStatus() {
    if (!checklist || busy) return;
    setActionError('');
    const nextStatus = checklist.status === 'draft' ? 'reviewed' : 'draft';
    const result = transitionChecklist(checklist, nextStatus, new Date().toISOString());
    if (!result.ok) {
      setActionError(result.errors[0]?.message ?? 'Could not change the review status.');
      return;
    }
    setBusy(true);
    setChecklist(result.value);
    setSaveState('unsaved');
    try {
      await localDatabase.emergencyChecklists.put(result.value);
      setSaveState('saved');
    } catch {
      setChecklist(checklist);
      setSaveState('error');
      setActionError('Could not save the review status on this device.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteChecklist() {
    if (!checklist || busy) return;
    if (!window.confirm('Delete this generic checklist from this browser? This cannot be undone here.')) return;
    setActionError('');
    setBusy(true);
    setSaveState('unsaved');
    try {
      await localDatabase.emergencyChecklists.delete(checklist.id);
      setChecklist(null);
      setSaveState('idle');
    } catch {
      setSaveState('error');
      setActionError('Could not delete the checklist from this browser.');
    } finally {
      setBusy(false);
    }
  }

  function downloadChecklist() {
    if (!checklist) return;
    try {
      const text = exportReviewedChecklist(checklist);
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'family-emergency-checklist.txt';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 250);
      setActionError('');
    } catch {
      setActionError('Review the checklist before exporting it.');
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold text-sky-800">{projectInfo.scope}</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{projectInfo.title}</h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Private, local planning</span>
        </header>

        <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5" aria-labelledby="privacy-heading">
          <h2 id="privacy-heading" className="flex items-center gap-2 font-semibold text-amber-950">
            <LuShieldCheck aria-hidden="true" /> Generic prompts only
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-950">
            This starter checklist has fixed prompts and checked/unchecked marks only. It does not ask for names, phone numbers, locations, meeting places, medical details or documents. Data is stored in this browser without application-level encryption or backup. Review the downloaded text before sharing it, and follow current local emergency instructions.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <LuBookOpenCheck className="mt-1 text-sky-800" size={22} aria-hidden="true" />
              <div>
                <h2 className="text-xl font-semibold">Household planning checklist</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Use these general prompts to review your plan together. They are not location-specific emergency instructions.</p>
              </div>
            </div>

            <div className="mb-5 rounded-lg bg-slate-50 p-3 text-sm" role="status" aria-live="polite" aria-busy={storageState === 'loading' || busy}>
              {storageState === 'loading' ? 'Opening local checklist storage…' : storageState === 'error' ? 'Could not open this browser’s local storage.' : saveMessage(saveState)}
            </div>

            {storageState === 'error' ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-900">The checklist was not loaded. Do not assume changes were saved.</p>
                <button className="mt-3 rounded-lg border border-red-300 px-4 py-2 font-medium text-red-900 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => void loadChecklist()}>
                  Try again
                </button>
              </div>
            ) : storageState === 'ready' && !checklist ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-5">
                <h3 className="font-semibold">No local checklist yet</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Create the generic checklist to start marking prompts for a household review.</p>
                <button disabled={busy} className="mt-4 rounded-lg bg-sky-800 px-4 py-2.5 font-medium text-white hover:bg-sky-900 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => void createChecklist()}>
                  Create checklist
                </button>
              </div>
            ) : checklist ? (
              <>
                <fieldset disabled={busy || checklist.status === 'reviewed'}>
                  <legend className="mb-3 text-sm font-semibold">Planning prompts</legend>
                  <ul className="space-y-3">
                    {emergencyChecklistItems.map((item) => {
                      const savedItem = checklist.items.find((entry) => entry.id === item.id);
                      return (
                        <li key={item.id} className="rounded-xl border border-slate-200 p-4">
                          <label className="flex cursor-pointer items-start gap-3 leading-6">
                            <input
                              className="mt-1 size-4 accent-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2"
                              type="checkbox"
                              checked={savedItem?.checked ?? false}
                              onChange={(event) => void changeItem(item.id, event.target.checked)}
                            />
                            <span>{item.label}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>

                <p className="mt-4 text-sm text-slate-600">
                  Status: <strong>{checklist.status === 'draft' ? 'Draft' : 'Reviewed'}</strong>. “Reviewed” means the prompts were discussed; it is not a readiness certification.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button disabled={busy} className="rounded-lg bg-sky-800 px-4 py-2.5 font-medium text-white hover:bg-sky-900 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => void changeReviewStatus()}>
                    {checklist.status === 'draft' ? 'Mark prompts reviewed' : 'Reopen for edits'}
                  </button>
                  {checklist.status === 'reviewed' && (
                    <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 font-medium hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2" onClick={downloadChecklist}>
                      <LuDownload aria-hidden="true" /> Download reviewed checklist
                    </button>
                  )}
                  <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 font-medium text-red-800 hover:bg-red-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => void deleteChecklist()}>
                    <LuTrash2 aria-hidden="true" /> Delete from this browser
                  </button>
                </div>

                {checklist.status === 'draft' && <p className="mt-3 text-xs leading-5 text-slate-500">Review the prompts with household members before downloading. The export includes only these fixed prompts and their checked state.</p>}
              </>
            ) : null}

            {actionError && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">{actionError}</p>}
          </div>

          <aside className="grid content-start gap-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <LuWifiOff className="mb-3 text-sky-800" aria-hidden="true" />
              <h2 className="font-semibold">Works without a server write</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">The checklist is saved to IndexedDB in this browser. There is no sync or account.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">Keep sensitive details out</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Local browser data has no application-level encryption, backup or recovery. This prototype cannot safely store contacts, addresses or personal emergency information.</p>
            </article>
          </aside>
        </section>

        <footer className="mt-8 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
          This checklist is a general planning aid, not a substitute for emergency services or current local authority guidance. The downloaded file is plain text; inspect it before sharing.
        </footer>
      </div>
    </main>
  );
}
