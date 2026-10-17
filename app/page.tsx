'use client';

import { useRouter } from 'next/navigation';
import { LoadingButton } from '@/app/components/interior/loading-button';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="bg-surface border-b border-border-default px-5 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-text-primary text-2xl md:text-3xl font-semibold tracking-wide truncate">
            Certificate Generator
          </h1>
          <p className="subtext mt-1 hidden sm:block">Choose a mode.</p>
        </div>
        <LoadingButton
          pendingLabel="Signing out"
          successLabel="Signed out"
          onAction={async () => {
            await fetch('/api/auth/signout', { method: 'POST' });
            router.replace('/login');
          }}
        >
          Sign out
        </LoadingButton>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push('/campaign')}
            className="rounded-xl border border-dashed border-border-strong bg-raised px-8 py-16 text-center hover:bg-hover"
          >
            <p className="text-text-primary text-lg font-semibold tracking-wide">Campaign</p>
            <p className="subtext mt-2">Draft subject, content, and a recipient CSV.</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/generate')}
            className="rounded-xl border border-dashed border-border-strong bg-raised px-8 py-16 text-center hover:bg-hover"
          >
            <p className="text-text-primary text-lg font-semibold tracking-wide">Generate certificate</p>
            <p className="subtext mt-2">The existing template, place, and export flow.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
