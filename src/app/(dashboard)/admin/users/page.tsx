import { UserTable } from '@/components/admin/UserTable';
import { Pagination } from '@/components/ui/Pagination';
import { getUsersPageData } from '@/lib/admin';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number((Array.isArray(params.page) ? params.page[0] : params.page) ?? '1');
  const search = Array.isArray(params.search) ? params.search[0] : params.search;
  const { users, pagination } = await getUsersPageData({ page, search });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Manage Users</h2>
          <p className="text-sm text-slate-500">Create, update roles, and deactivate staff accounts.</p>
        </div>
        <form action="/admin/users">
          <input
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            defaultValue={search}
            name="search"
            placeholder="Search users..."
            type="search"
          />
        </form>
      </div>

      <UserTable initialUsers={users} />

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        pathname="/admin/users"
        query={{ search }}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
      />
    </div>
  );
}
