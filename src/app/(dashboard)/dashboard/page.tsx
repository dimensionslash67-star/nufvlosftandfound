import Link from 'next/link';
import { ItemStatusBadge } from '@/components/items/ItemStatusBadge';
import { getAdminStatisticsData } from '@/lib/admin';
import { formatDisplayDate } from '@/lib/utils';

function ActionIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <svg
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

const AddIcon = (
  <ActionIcon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </ActionIcon>
);

const ItemsIcon = (
  <ActionIcon>
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
  </ActionIcon>
);

const ClaimedIcon = (
  <ActionIcon>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.3 2.3 4.7-5" />
  </ActionIcon>
);

const ReportIcon = (
  <ActionIcon>
    <path d="M4 19h16" />
    <path d="M7 16V9" />
    <path d="M12 16V5" />
    <path d="M17 16v-4" />
  </ActionIcon>
);

const metricCards = [
  { key: 'total', label: 'Total Items', valueKey: 'totalItems', accent: '#6366f1' },
  { key: 'available', label: 'Available', valueKey: 'availableItems', accent: '#10b981' },
  { key: 'claimed', label: 'Claimed', valueKey: 'claimedItems', accent: '#f59e0b' },
  { key: 'disposed', label: 'Disposed', valueKey: 'disposedItems', accent: '#ef4444' },
] as const;

const quickActions = [
  { href: '/items/add', label: 'Add New Item', bg: 'bg-[#6366f1] hover:bg-[#4f46e5]', icon: AddIcon },
  { href: '/items', label: 'View All Items', bg: 'bg-[#0ea5e9] hover:bg-[#0284c7]', icon: ItemsIcon },
  { href: '/items/claimed', label: 'Mark as Claimed', bg: 'bg-[#10b981] hover:bg-[#059669]', icon: ClaimedIcon },
  { href: '/admin/reports', label: 'Generate Report', bg: 'bg-[#0f172a] hover:bg-[#1e293b]', icon: ReportIcon },
] as const;

export default async function Page() {
  const { totals, recentItems } = await getAdminStatisticsData();

  return (
    <div className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <article
            key={card.key}
            className="overflow-hidden rounded-[14px] border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]"
          >
            <div className="h-1 w-full" style={{ backgroundColor: card.accent }} />
            <div className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {card.label}
              </p>
              <p className="mt-2 text-[36px] font-extrabold leading-none text-slate-900">
                {totals[card.valueKey]}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            className={`inline-flex items-center justify-start gap-3 rounded-[10px] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all duration-200 ${action.bg}`}
            href={action.href}
          >
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center">
              {action.icon}
            </span>
            {action.label}
          </Link>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-[#334155] dark:bg-[#1e293b]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-[#334155]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-[#f1f5f9]">Recent Items</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Latest records added to the system.</p>
          </div>
          <Link
            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            href="/items"
          >
            View All -&gt;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-[#334155]">
            <thead className="bg-brand-navy text-white dark:bg-[#0a1628]">
              <tr className="bg-brand-navy text-left text-xs font-semibold uppercase tracking-[0.08em] text-white dark:bg-[#0a1628]">
                <th className="px-4 py-3">
                  Item ID
                </th>
                <th className="px-4 py-3">
                  Item Name
                </th>
                <th className="px-4 py-3">
                  Category
                </th>
                <th className="px-4 py-3">
                  Location Found
                </th>
                <th className="px-4 py-3">
                  Date Added
                </th>
                <th className="px-4 py-3">
                  Status
                </th>
                <th className="px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#334155]">
              {recentItems.map((item) => (
                <tr
                  key={item.id}
                  className="bg-white transition-colors hover:bg-slate-50 dark:bg-[#1e293b] dark:hover:bg-[#0f172a]"
                >
                  <td className="px-4 py-3">
                    <span className="inline-block rounded border border-blue-200 bg-blue-100 px-2 py-1 font-mono text-xs font-semibold text-blue-800 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200">
                      {item.itemCode ?? item.id.slice(0, 12)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.itemName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.location}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {formatDisplayDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ItemStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="inline-flex rounded px-3 py-1.5 text-xs font-medium text-white transition-colors bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                      href={`/items/${item.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
