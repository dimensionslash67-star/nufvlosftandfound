import { redirect } from 'next/navigation';
import { OwnerDashboard } from '@/components/owner/OwnerDashboard';
import { getUserDisplayName } from '@/lib/utils';
import { getOwnerUser, hasOwnerPinSession } from '@/lib/ownerGuard';

export const dynamic = 'force-dynamic';

export default async function OwnerPage() {
  const owner = await getOwnerUser();

  if (!owner) {
    redirect('/login');
  }

  const pinVerified = await hasOwnerPinSession(owner.id);

  return (
    <OwnerDashboard
      ownerEmail={owner.email}
      ownerName={getUserDisplayName(owner)}
      pinVerified={pinVerified}
    />
  );
}
