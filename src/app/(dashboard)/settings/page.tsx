import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettingsAliasPage() {
  redirect('/admin/settings');
}
