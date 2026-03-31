import { headers } from 'next/headers';
import { OwnerDashboard } from '@/components/owner/OwnerDashboard';
import { getAuthenticatedUserFromCookies } from '@/lib/admin';
import { getUserDisplayName } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function OwnerPage() {
  const user = await getAuthenticatedUserFromCookies();
  const requestHeaders = await headers();
  const resolvedUser = user ?? {
    email: requestHeaders.get('x-user-email') ?? '',
    username: requestHeaders.get('x-user-username') ?? 'User',
    firstName: null,
    lastName: null,
  };

  return (
    <OwnerDashboard
      userEmail={resolvedUser.email}
      userName={getUserDisplayName(resolvedUser)}
    />
  );
}
