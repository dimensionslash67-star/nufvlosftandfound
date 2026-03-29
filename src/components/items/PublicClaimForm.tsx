'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function PublicClaimForm({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState({
    name: '',
    contact: '',
    message: '',
  });

  if (submitted) {
    return (
      <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-800">
        <p className="font-semibold">Claim details captured.</p>
        <p className="mt-2">
          Formal claims still require staff authentication. Continue to the login page to complete the verification process for item {itemId}.
        </p>
        <Link className="mt-4 inline-flex font-semibold text-brand-violet hover:text-brand-navy" href={`/login?claim=${itemId}`}>
          Continue to Staff Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen((current) => !current)} type="button" variant="success">
        Submit a Claim
      </Button>

      {open ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <Input
            label="Your Name"
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            value={values.name}
          />
          <Input
            label="Contact Information"
            onChange={(event) => setValues((current) => ({ ...current, contact: event.target.value }))}
            value={values.contact}
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Message</span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30"
              onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
              placeholder="Describe identifying marks or details that prove ownership."
              value={values.message}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!values.name || !values.contact || !values.message}
              onClick={() => setSubmitted(true)}
              type="button"
            >
              Save Claim Intent
            </Button>
            <Link
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-navy hover:text-brand-navy"
              href={`/login?claim=${itemId}`}
            >
              Login to Continue
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
