import { DashboardLayout as SharedDashboardLayout } from '@/components/layout/DashboardLayout';
import { getAuthenticatedUserFromRequest } from '@/lib/admin';
import type { SessionUser } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const resolveInitialUser = async (): Promise<SessionUser | null> => {
    const user = await getAuthenticatedUserFromRequest();

    if (user) {
      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    }

    return null;
  };

  return <SharedDashboardLayout initialUser={await resolveInitialUser()}>{children}</SharedDashboardLayout>;
}
