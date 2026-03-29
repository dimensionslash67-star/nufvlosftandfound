import { RegisterForm } from '@/components/auth/RegisterForm';

export default function Page() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 23, 42, 0.82), rgba(15, 118, 110, 0.32)), url('/images/login-bg.jpg')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl backdrop-blur md:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden flex-col justify-between border-r border-white/10 p-12 md:flex">
          <div className="space-y-4">
            <span className="inline-flex w-fit rounded-full border border-brand-light/30 bg-brand-light/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-light">
              New Account Setup
            </span>
            <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white">
              Create a secure account for the NUFV lost and found workflow.
            </h1>
            <p className="max-w-lg text-sm leading-6 text-slate-200">
              Register once to report items, check claim status, and access protected campus
              recovery tools.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-6 text-sm text-slate-200">
            <p className="font-medium text-white">What happens next</p>
            <p className="mt-2">
              After registration, a JWT session is created immediately and you are redirected into
              the dashboard.
            </p>
          </div>
        </section>

        <section className="bg-white p-8 text-slate-900 md:p-12">
          <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-center">
            <div className="mb-8 space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand">
                NUFV Registration
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">Create your account</h2>
              <p className="text-sm text-slate-600">
                Enter your details to start using the new lost and found system.
              </p>
            </div>

            <RegisterForm />
          </div>
        </section>
      </div>
    </main>
  );
}
