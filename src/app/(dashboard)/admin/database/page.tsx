import { OwnerDashboard } from '@/components/owner/OwnerDashboard';
import { getFallbackAuthenticatedUser } from '@/lib/auth';
import { getAdminConsoleUserFromRequest } from '@/lib/admin';
import { getUserDisplayName } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DatabasePage() {
  const user = (await getAdminConsoleUserFromRequest()) ?? (await getFallbackAuthenticatedUser());

  if (!user) {
    return null;
  }

  return <OwnerDashboard userEmail={user.email} userName={getUserDisplayName(user)} />;
}
