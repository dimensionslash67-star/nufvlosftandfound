import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ItemForm } from '@/components/items/ItemForm';
import { getAuthCookieName, verifyJWT } from '@/lib/auth';
import { getItemById } from '@/lib/items';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(getAuthCookieName())?.value;
  const session = token ? await verifyJWT(token) : null;
  const canManage = session?.role === 'ADMIN' || session?.userId === item.reporterId;

  if (!canManage) {
    redirect(`/items/${item.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Edit Item</h1>
        <p className="text-sm text-slate-500">Update the details for this lost and found record.</p>
      </div>

      <ItemForm item={item} mode="edit" />
    </div>
  );
}
