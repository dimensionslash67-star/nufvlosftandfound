'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function OwnerPinPage() {
  const router = useRouter();
  const [isPinSet, setIsPinSet] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPinStatus() {
      try {
        const response = await fetch('/api/owner/pin/verify', { cache: 'no-store' });
        const body = (await response.json().catch(() => ({}))) as {
          isPinSet?: boolean;
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setMessage(body.error ?? 'You are not authorized to use the Owner Console.');
          return;
        }

        setIsPinSet(Boolean(body.isPinSet));
      } catch {
        if (!cancelled) {
          setMessage('Unable to check the Owner PIN status. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPinStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!/^\d{4}$/.test(pin)) {
      setMessage('Enter a 4-digit PIN.');
      return;
    }

    if (!isPinSet && pin !== confirmation) {
      setMessage('The PIN entries do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/owner/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isPinSet ? { pin } : { setupPin: pin }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setMessage(body.message ?? 'Owner PIN verification failed.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setMessage('Unable to reach the Owner PIN service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-navy dark:text-indigo-300">
            Owner Console
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isPinSet === false ? 'Set your Owner PIN' : 'Enter your Owner PIN'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {isPinSet === false
              ? 'Create the 4-digit PIN required for owner-protected actions.'
              : 'Verify your PIN to unlock owner-protected actions for this session.'}
          </p>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">Checking PIN status…</p>
        ) : message && isPinSet === null ? (
          <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
            {message}
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input
              autoComplete="one-time-code"
              inputMode="numeric"
              label={isPinSet === false ? 'New 4-digit PIN' : '4-digit PIN'}
              maxLength={4}
              name="pin"
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              pattern="[0-9]{4}"
              required
              type="password"
              value={pin}
            />

            {isPinSet === false ? (
              <Input
                autoComplete="one-time-code"
                inputMode="numeric"
                label="Confirm PIN"
                maxLength={4}
                name="confirmation"
                onChange={(event) => setConfirmation(event.target.value.replace(/\D/g, '').slice(0, 4))}
                pattern="[0-9]{4}"
                required
                type="password"
                value={confirmation}
              />
            ) : null}

            {message ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
                {message}
              </p>
            ) : null}

            <Button className="w-full" disabled={submitting} type="submit">
              {submitting
                ? 'Working…'
                : isPinSet === false
                  ? 'Set Owner PIN'
                  : 'Verify Owner PIN'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
