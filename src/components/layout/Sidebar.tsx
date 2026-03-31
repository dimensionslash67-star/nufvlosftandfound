'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  dashboardNavGroups,
  isDashboardItemActive,
  type DashboardNavItem,
} from '@/components/layout/dashboard-config';
import { useAuth } from '@/hooks/useAuth';
import { OWNER_EMAIL } from '@/lib/owner';
import { cn } from '@/lib/utils';

export function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.email === OWNER_EMAIL;

  const renderLink = (item: DashboardNavItem) => {
    if (item.adminOnly && !isAdmin) {
      return null;
    }

    if (item.ownerOnly && !isOwner) {
      return null;
    }

    const active = isDashboardItemActive(pathname, item);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        className={cn(
          'group relative flex items-center gap-2 rounded-[8px] px-4 py-2.5 text-[13px] font-medium transition-all duration-150',
          'text-[#94a3b8] hover:bg-white/[0.06] hover:text-[#e2e8f0]',
          active && 'border-l-[3px] border-l-[#6366f1] bg-[rgba(99,102,241,0.15)] pl-[13px] text-white',
          item.danger && !active && 'hover:text-[#fca5a5]',
        )}
        href={item.href}
        onClick={onClose}
        title={item.label}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0',
            active
              ? 'text-[#818cf8]'
              : item.danger
                ? 'text-[#94a3b8] group-hover:text-[#f87171]'
                : 'text-[#94a3b8]',
          )}
        />
        <span className="hidden md:inline">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {mobileOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-950/55 md:hidden dark:bg-black/70"
          onClick={onClose}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-16 flex-col bg-[#0f1b35] text-white transition-transform duration-200 md:w-[240px] md:translate-x-0 dark:bg-[#0a1628]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-white/[0.08] px-4 py-5">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <Image
              alt="NU Fairview Logo"
              className="h-10 w-10 rounded-full"
              height={40}
              src="/images/logo-circle.png"
              width={40}
            />
            <div className="hidden min-w-0 md:block">
              <p className="text-[14px] font-bold text-white">NU Fairview</p>
              <p className="text-[11px] text-slate-400">Lost &amp; Found Admin</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-2 py-3">
          {dashboardNavGroups
            .filter((group) => group.placement !== 'bottom')
            .map((group) => (
              <div key={group.key} className="mt-4 first:mt-0">
                <p className="hidden px-4 pb-2 text-[10px] uppercase tracking-[0.1em] text-slate-600 md:block">
                  {group.label}
                </p>
                <nav className="space-y-1">{group.items.map(renderLink)}</nav>
              </div>
            ))}

          <div className="mt-auto pt-4">
            {dashboardNavGroups
              .filter((group) => group.placement === 'bottom')
              .map((group) => (
                <div key={group.key} className="mt-4">
                  <p className="hidden px-4 pb-2 text-[10px] uppercase tracking-[0.1em] text-slate-600 md:block">
                    {group.label}
                  </p>
                  <nav className="space-y-1">{group.items.map(renderLink)}</nav>
                </div>
              ))}
          </div>
        </div>
      </aside>
    </>
  );
}
