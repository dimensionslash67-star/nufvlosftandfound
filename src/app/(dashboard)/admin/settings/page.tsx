import { redirect } from 'next/navigation';
import { ProfileSettings } from '@/components/admin/ProfileSettings';
import { getAdminSessionFromCookies } from '@/lib/admin';

export default async function Page() {
  const user = await getAdminSessionFromCookies();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[14px] border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Logged in as <strong>{user.username}</strong> ({user.role})
        </p>
        <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">{user.email}</p>
      </div>

      <ProfileSettings initialUser={user} />
    </div>
  );
}
