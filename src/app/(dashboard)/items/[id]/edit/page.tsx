import { notFound, redirect } from 'next/navigation';
import { ItemForm } from '@/components/items/ItemForm';
import { getCurrentUser } from '@/lib/auth';
import { getEditableItemById } from '@/lib/items';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const item = await getEditableItemById(id, currentUser);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Edit Item</h1>
        <p className="text-sm text-slate-500">Update the details for this lost and found record.</p>
      </div>

      <ItemForm canDelete item={item} mode="edit" />
    </div>
  );
}
