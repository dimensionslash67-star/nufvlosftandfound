import { ManageItemsDashboard } from '@/components/items/ManageItemsDashboard';
import { getCurrentUser } from '@/lib/auth';
import type { SessionUser } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser();
  const initialUser: SessionUser | null = user
    ? {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }
    : null;

  return <ManageItemsDashboard initialUser={initialUser} />;
}
