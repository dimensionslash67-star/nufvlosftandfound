'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail ?? '');
      setError(null);
      setSuccessMessage(null);
    }
  }, [defaultEmail, isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({
        message: 'If an account exists, a reset link has been sent.',
      }));

      if (!response.ok) {
        throw new Error(data.error ?? data.message ?? 'Unable to send reset email.');
      }

      setSuccessMessage(data.message ?? 'If an account exists, a reset link has been sent.');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to send reset email. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      contentClassName="max-w-md dark:border dark:border-[#334155]"
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={isOpen}
      title="Forgot Password"
    >
      {successMessage ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={onClose} type="button">
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Enter your email address and we&apos;ll send you a secure reset link.
          </p>

          <Input
            label="Email Address"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your.email@nu-fairview.edu.ph"
            required
            type="email"
            value={email}
          />

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={loading} type="submit">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
