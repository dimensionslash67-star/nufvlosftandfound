import { SettingsForm } from '@/components/admin/SettingsForm';
import { getSettingsData } from '@/lib/admin';

export default async function Page() {
  const settings = await getSettingsData();

  return <SettingsForm initialSettings={settings} />;
}
