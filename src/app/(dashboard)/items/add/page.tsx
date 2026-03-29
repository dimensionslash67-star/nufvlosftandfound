import { ItemForm } from '@/components/items/ItemForm';

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Add Found Item</h1>
        <p className="text-sm text-slate-500">
          Record a newly found item and optionally attach a photo.
        </p>
      </div>

      <ItemForm mode="create" />
    </div>
  );
}

