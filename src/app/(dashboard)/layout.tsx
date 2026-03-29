import { DashboardLayout as SharedDashboardLayout } from '@/components/layout/DashboardLayout';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SharedDashboardLayout>{children}</SharedDashboardLayout>;
}
