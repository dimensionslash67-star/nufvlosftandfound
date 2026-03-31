'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ContactITSupportModal } from '@/components/auth/ContactITSupportModal';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { loginIdentifierSchema } from '@/lib/validations';

type LoginFormValues = z.infer<typeof loginIdentifierSchema>;

function EnvelopeIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M4 6h16v12H4z" />
      <path d="m4 8 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect height="11" rx="2" width="14" x="5" y="11" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [itSupportOpen, setItSupportOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginIdentifierSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    const data = await response.json().catch(() => ({ message: 'Unable to process login.' }));

    if (!response.ok) {
      setSubmitError(data.message ?? 'Invalid credentials.');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  });

  const identifier = watch('email');
  const defaultSupportEmail = identifier?.includes('@') ? identifier : undefined;

  return (
    <>
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email Address
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition focus-within:border-[#7c3aed] focus-within:ring-2 focus-within:ring-[#7c3aed]/15">
            <EnvelopeIcon />
            <input
              id="email"
              autoComplete="username"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Enter your email or username"
              type="text"
              {...register('email')}
            />
          </div>
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition focus-within:border-[#7c3aed] focus-within:ring-2 focus-within:ring-[#7c3aed]/15">
            <LockIcon />
            <input
              id="password"
              autoComplete="current-password"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
            />
            <button
              className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-[#7c3aed]"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password ? (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input className="h-4 w-4 rounded border-slate-300 text-[#7c3aed]" type="checkbox" />
            <span>Remember me</span>
          </label>
          <button
            className="font-medium text-[#7c3aed] hover:text-[#6d28d9]"
            onClick={() => setForgotPasswordOpen(true)}
            type="button"
          >
            Forgot password?
          </button>
        </div>

        {submitError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        <button
          className="w-full rounded-xl bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Signing in...' : 'Login to Dashboard ->'}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">OR</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <a
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#7c3aed] hover:text-[#7c3aed]"
          href="/"
        >
          {'<-'} Back to Public View
        </a>

        <div className="space-y-2 pt-2 text-center">
          <p className="text-sm text-slate-500">
            For students: no login is required to browse available items.
          </p>
          <button
            className="text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9]"
            onClick={() => setItSupportOpen(true)}
            type="button"
          >
            Contact IT Support
          </button>
        </div>
      </form>

      <ForgotPasswordModal
        defaultEmail={defaultSupportEmail}
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
      <ContactITSupportModal
        defaultEmail={defaultSupportEmail}
        isOpen={itSupportOpen}
        onClose={() => setItSupportOpen(false)}
      />
    </>
  );
}
