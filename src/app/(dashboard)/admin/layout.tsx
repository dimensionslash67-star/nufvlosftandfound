import { getAuthenticatedUserFromRequest } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await getAuthenticatedUserFromRequest();
  return <>{children}</>;
}
