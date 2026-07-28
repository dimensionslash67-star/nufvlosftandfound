import { ProfileSettings } from '@/components/admin/ProfileSettings';
import { requireAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function Page() {
  const user = await requireAdmin();

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
