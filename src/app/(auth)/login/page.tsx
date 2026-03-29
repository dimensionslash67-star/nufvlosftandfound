import Image from 'next/image';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Page() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-8 sm:px-6"
      style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
    >
      <div className="w-full max-w-[900px] overflow-hidden rounded-[16px] bg-white/95 shadow-[0_28px_70px_rgba(15,23,42,0.28)] sm:grid sm:min-h-[550px] sm:grid-cols-1 md:grid-cols-[0.95fr_1.05fr]">
        <section
          className="relative hidden min-h-[280px] flex-col justify-between bg-cover bg-[center_top] p-8 text-white sm:flex md:p-10"
          style={{ backgroundImage: "url('/images/loginpanel.jpg')" }}
        >
          <div className="absolute inset-0 bg-[rgba(30,30,40,0.45)]" />

          <div className="relative z-10 flex flex-1 flex-col justify-between">
            <div className="space-y-8 text-center md:text-left">
              <div className="flex justify-center md:justify-start">
                <Image
                  alt="NU Logo"
                  height={72}
                  priority
                  src="/images/logo-circle.png"
                  width={72}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-white/80">
                  NU FAIRVIEW
                </p>
                <p className="text-base font-medium text-white/90">
                  Lost &amp; Found Management System
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-4 text-center md:text-left">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Staff Portal</h1>
              <p className="max-w-sm text-sm leading-6 text-white/85">
                Secure access for authorized staff managing item records, verification, audit
                logs, and claim processing.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[rgba(255,255,255,0.97)] p-6 text-slate-900 sm:p-8 md:p-10">
          <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center">
            <div className="mb-8 space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Staff Login</h2>
              <p className="text-sm text-slate-600">
                Enter your credentials to access the admin panel.
              </p>
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
