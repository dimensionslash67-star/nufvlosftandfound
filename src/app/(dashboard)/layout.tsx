import { DashboardLayout as SharedDashboardLayout } from '@/components/layout/DashboardLayout';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SharedDashboardLayout>{children}</SharedDashboardLayout>;
}
