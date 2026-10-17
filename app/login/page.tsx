'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingButton } from '@/app/components/interior/loading-button';
import { SegmentedControl } from '@/app/components/interior/segmented-control';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    const path = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(payload.error ?? 'Could not continue.');
      throw new Error(payload.error);
    }
    const next = search.get('next');
    router.replace(next && next.startsWith('/') ? next : '/');
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <form
        className="w-full max-w-md rounded-xl border border-border-default bg-surface p-8"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
        }}
      >
        <h1 className="text-text-primary text-2xl font-semibold tracking-wide">Certificate Generator</h1>
        <p className="subtext mt-2">Email and password only. This account stays in Homelab schema mass_mailer.</p>

        <div className="mt-6">
          <SegmentedControl
            label="Account action"
            value={mode}
            onValueChange={(value) => setMode(value as 'signin' | 'signup')}
            options={[
              { value: 'signin', label: 'Sign in' },
              { value: 'signup', label: 'Sign up' },
            ]}
          />
        </div>

        <label className="block mt-6 text-text-secondary text-sm">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-border-default bg-raised px-3 py-2 text-text-primary"
            required
          />
        </label>
        <label className="block mt-4 text-text-secondary text-sm">
          Password
          <input
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-border-default bg-raised px-3 py-2 text-text-primary"
            minLength={8}
            required
          />
        </label>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <div className="mt-6">
          <LoadingButton
            className="w-full"
            pendingLabel={mode === 'signup' ? 'Creating account' : 'Signing in'}
            successLabel="Continue"
            onAction={submit}
          >
            {mode === 'signup' ? 'Sign up' : 'Sign in'}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-base" />}>
      <LoginForm />
    </Suspense>
  );
}
