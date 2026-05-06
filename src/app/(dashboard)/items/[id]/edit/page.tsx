import { notFound, redirect } from 'next/navigation';
import { ItemForm } from '@/components/items/ItemForm';
import { getAuthenticatedUserFromRequest } from '@/lib/admin';
import { getItemById } from '@/lib/items';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    notFound();
  }

  const currentUser = await getAuthenticatedUserFromRequest();

  if (!currentUser) {
    redirect('/login');
  }

  const canManage = currentUser.role === 'ADMIN' || currentUser.id === item.reporterId;

  if (!canManage) {
    redirect(`/items/${item.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Edit Item</h1>
        <p className="text-sm text-slate-500">Update the details for this lost and found record.</p>
      </div>

      <ItemForm canDelete={canManage} item={item} mode="edit" />
    </div>
  );
}
