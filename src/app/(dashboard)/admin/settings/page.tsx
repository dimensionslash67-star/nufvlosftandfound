import { headers } from 'next/headers';
import { ProfileSettings } from '@/components/admin/ProfileSettings';
import { getAuthenticatedUserFromCookies } from '@/lib/admin';

export default async function Page() {
  const user = await getAuthenticatedUserFromCookies();
  const requestHeaders = await headers();
  const resolvedUser = user ?? {
    id: requestHeaders.get('x-user-id') ?? '',
    email: requestHeaders.get('x-user-email') ?? '',
    username: requestHeaders.get('x-user-username') ?? 'User',
    firstName: null,
    lastName: null,
    role: (requestHeaders.get('x-user-role') as 'ADMIN' | 'USER' | null) ?? 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[14px] border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Logged in as <strong>{resolvedUser.username}</strong> ({resolvedUser.role})
        </p>
        <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">{resolvedUser.email}</p>
      </div>

      <ProfileSettings initialUser={resolvedUser} />
    </div>
  );
}
