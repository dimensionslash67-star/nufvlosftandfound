'use client';

import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Sidebar } from '@/components/layout/Sidebar';

export function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('nufv-theme');

    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0f172a] dark:text-[#f1f5f9]">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen md:pl-[240px]">
        <DashboardHeader onMenuToggle={() => setSidebarOpen((current) => !current)} />
        <main className="px-4 py-5 sm:px-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
