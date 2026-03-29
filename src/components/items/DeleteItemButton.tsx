'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <button
      className="inline-flex items-center rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      disabled={isDeleting}
      type="button"
      onClick={async () => {
        const confirmed = window.confirm('Delete this item permanently?');

        if (!confirmed) {
          return;
        }

        setIsDeleting(true);

        const response = await fetch(`/api/items/${itemId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          setIsDeleting(false);
          window.alert('Unable to delete the item.');
          return;
        }

        router.push('/items');
        router.refresh();
      }}
    >
      {isDeleting ? 'Deleting...' : 'Delete Item'}
    </button>
  );
}

