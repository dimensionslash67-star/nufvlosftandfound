import { redirect } from 'next/navigation';
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

  if (!currentUser) {
    redirect('/login');
  }

  const resolveInitialUser = async (): Promise<SessionUser | null> => {
    return {
      ...currentUser,
      createdAt: currentUser.createdAt.toISOString(),
      updatedAt: currentUser.updatedAt.toISOString(),
    };
  };

  return <SharedDashboardLayout initialUser={await resolveInitialUser()}>{children}</SharedDashboardLayout>;
}
