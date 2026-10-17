'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { emailsFromCsvText } from '@/app/lib/mailer/csv-emails';
import { LoadingButton } from '@/app/components/interior/loading-button';
import { MAX_CSV_BYTES, formatBytes, isCsvFile } from '@/app/lib/files';

type Draft = {
  id: string;
  subject: string;
  content: string;
  recipients: string[];
  updated_at: string;
};

export default function CampaignPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [csvColumn, setCsvColumn] = useState('');
  const [csvError, setCsvError] = useState('');

  const loadDrafts = useCallback(async () => {
    const res = await fetch('/api/campaigns');
    if (res.status === 401) {
      router.replace('/login');
      return;
    }
    const payload = (await res.json()) as { campaigns?: Draft[] };
    setDrafts(payload.campaigns ?? []);
  }, [router]);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  const applyDraft = (draft: Draft) => {
    setActiveId(draft.id);
    setSubject(draft.subject);
    setContent(draft.content);
    setRecipients(Array.isArray(draft.recipients) ? draft.recipients : []);
    setCsvColumn('');
    setCsvError('');
  };

  const onCsv = useCallback((file: File) => {
    setCsvError('');
    if (!isCsvFile(file)) {
      setCsvError('Use a .csv file.');
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      setCsvError(`CSV is too large (${formatBytes(file.size)}). Max is ${formatBytes(MAX_CSV_BYTES)}.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = emailsFromCsvText(String(reader.result ?? ''));
        setRecipients(parsed.emails);
        setCsvColumn(parsed.column);
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : 'Could not read that CSV.');
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop: (files) => {
      const file = files[0];
      if (file) onCsv(file);
    },
  });

  const save = async () => {
    const body = { subject, content, recipients };
    const res = await fetch(activeId ? `/api/campaigns/${activeId}` : '/api/campaigns', {
      method: activeId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = (await res.json()) as { campaign?: Draft; error?: string };
    if (!res.ok || !payload.campaign) {
      throw new Error(payload.error ?? 'Could not save draft.');
    }
    applyDraft(payload.campaign);
    await loadDrafts();
  };

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="bg-surface border-b border-border-default px-5 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-text-primary text-2xl md:text-3xl font-semibold tracking-wide truncate">Campaign</h1>
          <p className="subtext mt-1 hidden sm:block">Draft only. Sending is not wired yet.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="subtext" onClick={() => router.push('/')}>
            Home
          </button>
          <LoadingButton pendingLabel="Saving" successLabel="Saved" onAction={save}>
            Save draft
          </LoadingButton>
        </div>
      </header>

      <div className="flex-1 grid min-h-0 lg:grid-cols-[220px_1fr_260px]">
        <aside className="border-b lg:border-b-0 lg:border-r border-border-default p-4 overflow-auto">
          <p className="text-text-secondary text-xs tracking-wide uppercase">Drafts</p>
          <button
            type="button"
            className="mt-3 w-full rounded-md border border-border-default bg-raised px-3 py-2 text-left text-text-primary text-sm"
            onClick={() => {
              setActiveId(null);
              setSubject('');
              setContent('');
              setRecipients([]);
              setCsvColumn('');
              setCsvError('');
            }}
          >
            New draft
          </button>
          <ul className="mt-3 space-y-2">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <button
                  type="button"
                  onClick={() => applyDraft(draft)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    activeId === draft.id ? 'bg-accent-dim text-accent' : 'bg-raised text-text-primary'
                  }`}
                >
                  {draft.subject.trim() || 'Untitled'}
                  <span className="block text-xs text-text-secondary">{draft.recipients.length} recipients</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="p-5 md:p-8 flex flex-col gap-4 min-h-0">
          <label className="text-text-secondary text-sm">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1 w-full rounded-md border border-border-default bg-raised px-3 py-2 text-text-primary"
            />
          </label>
          <label className="text-text-secondary text-sm flex-1 flex flex-col min-h-0">
            Content
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="mt-1 w-full flex-1 min-h-[240px] rounded-md border border-border-default bg-raised px-3 py-2 text-text-primary"
            />
          </label>
        </main>

        <aside className="border-t lg:border-t-0 lg:border-l border-border-default p-4">
          <div
            {...getRootProps()}
            className={`rounded-xl border border-dashed px-4 py-10 text-center cursor-pointer ${
              isDragActive ? 'border-accent bg-accent-dim' : 'border-border-strong bg-raised'
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-text-primary text-sm font-medium tracking-wide">Upload CSV</p>
            <p className="subtext mt-2">The email column is detected from the header or from address-shaped cells.</p>
          </div>
          {csvError ? <p className="mt-3 text-sm text-danger">{csvError}</p> : null}
          {recipients.length > 0 ? (
            <p className="mt-3 text-sm text-text-secondary">
              {recipients.length} recipients{csvColumn ? ` from “${csvColumn}”` : ''}.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
