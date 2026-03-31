'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export function ContactITSupportModal({
  isOpen,
  onClose,
  defaultEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail ?? '');
      setMessage('');
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
      const response = await fetch('/api/contact/it-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, message }),
      });

      const data = await response.json().catch(() => ({
        message: 'Unable to send your message right now.',
      }));

      if (!response.ok) {
        throw new Error(data.error ?? data.message ?? 'Unable to send your message.');
      }

      setSuccessMessage(
        data.message ?? 'Your message has been sent. We will respond to your email shortly.',
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to send your message. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      contentClassName="max-w-lg dark:border dark:border-[#334155]"
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={isOpen}
      title="Contact IT Support"
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
            Send a message to IT support if you need account access or help signing in.
          </p>

          <Input
            label="Your Email Address"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your.email@nu-fairview.edu.ph"
            required
            type="email"
            value={email}
          />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Message</span>
            <textarea
              className="min-h-[140px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe the issue you need help with."
              required
              rows={5}
              value={message}
            />
          </label>

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
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
