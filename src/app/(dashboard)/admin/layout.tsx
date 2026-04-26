import { redirect } from 'next/navigation';
import { getAuthenticatedUserFromRequest, hasAdminConsoleAccess } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUserFromRequest();

  if (!user) {
    redirect('/login');
  }

  if (!hasAdminConsoleAccess(user)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
