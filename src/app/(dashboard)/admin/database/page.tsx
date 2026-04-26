import { redirect } from 'next/navigation';
import { OwnerDashboard } from '@/components/owner/OwnerDashboard';
import { getAdminConsoleUserFromRequest } from '@/lib/admin';
import { getUserDisplayName } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DatabasePage() {
  const user = await getAdminConsoleUserFromRequest();

  if (!user) {
    redirect('/dashboard');
  }

  return <OwnerDashboard userEmail={user.email} userName={getUserDisplayName(user)} />;
}
