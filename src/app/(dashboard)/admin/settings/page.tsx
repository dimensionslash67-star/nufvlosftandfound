import { ProfileSettings } from '@/components/admin/ProfileSettings';
import { getAdminSessionFromCookies } from '@/lib/admin';

export default async function Page() {
  const user = await getAdminSessionFromCookies();

  if (!user) {
    return null;
  }

  return <ProfileSettings initialUser={user} />;
}
