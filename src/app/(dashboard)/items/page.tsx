import { redirect } from 'next/navigation';
import { ManageItemsDashboard } from '@/components/items/ManageItemsDashboard';
import { getCurrentUser } from '@/lib/auth';
import type { SessionUser } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const initialUser: SessionUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  return <ManageItemsDashboard initialUser={initialUser} />;
}
