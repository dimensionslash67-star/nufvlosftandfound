'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn, getUserDisplayName } from '@/lib/utils';

const navigation = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/items/add', label: 'Add Found Item' },
  { href: '/items', label: 'Manage Items' },
  { href: '/admin/users', label: 'Manage Users' },
  { href: '/items/claimed', label: 'Claimed Items' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
];

const footerLinks = [
  { href: '/admin/settings', label: 'Settings' },
  { href: '/', label: 'View Public Site' },
  { href: '/logout', label: 'Logout' },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col bg-brand-navy px-5 py-6 text-white lg:flex">
          <Link className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/5" href="/">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gold text-lg font-black text-brand-navy">
              NU
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">NUFV</p>
              <p className="text-base font-semibold">Lost and Found</p>
            </div>
          </Link>

          <nav className="mt-8 flex-1 space-y-2">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  className={cn(
                    'flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition',
                    active ? 'bg-white/16 text-white shadow-inner' : 'text-white/75 hover:bg-white/10 hover:text-white',
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-white/10 pt-5">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                className="flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white px-5 py-4 shadow-sm md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <input
                  className="w-full max-w-xl rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30"
                  placeholder="Search dashboard shortcuts, items, or categories"
                  type="search"
                />
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gold font-bold text-brand-navy">
                  {(user?.username ?? 'SU').slice(0, 2).toUpperCase()}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {loading ? 'Loading...' : getUserDisplayName(user ?? undefined)}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {loading ? 'SESSION' : user?.role ?? 'USER'}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
