import { DashboardLayout as SharedDashboardLayout } from '@/components/layout/DashboardLayout';
import { getAuthenticatedUserFromRequest } from '@/lib/admin';
import type { SessionUser } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getAuthenticatedUserFromRequest();
  const initialUser: SessionUser | null = currentUser
    ? {
        ...currentUser,
        createdAt: currentUser.createdAt.toISOString(),
        updatedAt: currentUser.updatedAt.toISOString(),
      }
    : null;

  return <SharedDashboardLayout initialUser={initialUser}>{children}</SharedDashboardLayout>;
}
