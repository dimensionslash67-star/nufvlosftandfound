import { LegacyAddItemForm } from '@/components/items/LegacyAddItemForm';
import { getAuthenticatedUserFromRequest } from '@/lib/admin';

export default async function Page() {
  const user = await getAuthenticatedUserFromRequest();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-[#f1f5f9]">
          Add Found Item
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Record a newly found item using the legacy intake layout mapped to the
          current database schema.
        </p>
      </div>

      <LegacyAddItemForm
        initialUser={
          user
            ? {
                ...user,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
              }
            : null
        }
      />
    </div>
  );
}
