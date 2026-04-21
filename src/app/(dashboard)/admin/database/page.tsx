import { redirect } from 'next/navigation';
import { OwnerDashboard } from '@/components/owner/OwnerDashboard';
import { getAdminConsoleUserFromCookies } from '@/lib/admin';
import { getUserDisplayName } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DatabasePage() {
  const user = await getAdminConsoleUserFromCookies();

  if (!user) {
    redirect('/dashboard');
  }

  return <OwnerDashboard userEmail={user.email} userName={getUserDisplayName(user)} />;
}
