import type { ReactNode, SVGProps } from 'react';

function BaseIcon(props: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  const { children, ...rest } = props;

  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
      {...rest}
    >
      {children}
    </svg>
  );
}

function LayoutDashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="7" height="7" rx="1.5" />
      <rect x="14" y="4" width="7" height="4" rx="1.5" />
      <rect x="14" y="11" width="7" height="9" rx="1.5" />
      <rect x="3" y="14" width="7" height="6" rx="1.5" />
    </BaseIcon>
  );
}

function PlusCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </BaseIcon>
  );
}

function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </BaseIcon>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M16 21v-1.5a3.5 3.5 0 0 0-3.5-3.5H7.5A3.5 3.5 0 0 0 4 19.5V21" />
      <circle cx="10" cy="8" r="3.5" />
      <path d="M20 21v-1a3 3 0 0 0-2.4-2.94" />
      <path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4" />
    </BaseIcon>
  );
}

function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5" />
    </BaseIcon>
  );
}

function BarChart2Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4 19h16" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-4" />
    </BaseIcon>
  );
}

function FileTextIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M9 9h2" />
    </BaseIcon>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v2.2" />
      <path d="M12 18.8V21" />
      <path d="m4.93 4.93 1.56 1.56" />
      <path d="m17.51 17.51 1.56 1.56" />
      <path d="M3 12h2.2" />
      <path d="M18.8 12H21" />
      <path d="m4.93 19.07 1.56-1.56" />
      <path d="m17.51 6.49 1.56-1.56" />
      <circle cx="12" cy="12" r="3.2" />
    </BaseIcon>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3 5 6v5c0 4.2 2.7 8 7 10 4.3-2 7-5.8 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.3-3.7" />
    </BaseIcon>
  );
}

function ExternalLinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 14v5h-5" />
      <path d="M10 19H5V5h5" />
    </BaseIcon>
  );
}

function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
      <path d="M10 17 5 12l5-5" />
      <path d="M5 12h10" />
    </BaseIcon>
  );
}

export type DashboardNavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  danger?: boolean;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  matches: RegExp[];
};

export const dashboardNavGroups: Array<{
  key: string;
  label: string;
  placement?: 'top' | 'bottom';
  items: DashboardNavItem[];
}> = [
  {
    key: 'main',
    label: 'MAIN',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboardIcon,
        matches: [/^\/dashboard$/],
      },
      {
        href: '/items/add',
        label: 'Add Found Item',
        icon: PlusCircleIcon,
        matches: [/^\/items\/add$/],
      },
      {
        href: '/items',
        label: 'Manage Items',
        icon: ListIcon,
        matches: [/^\/items$/, /^\/items\/[^/]+$/, /^\/items\/[^/]+\/edit$/],
      },
      {
        href: '/admin/users',
        label: 'Manage Users',
        icon: UsersIcon,
        adminOnly: true,
        matches: [/^\/admin\/users$/],
      },
    ],
  },
  {
    key: 'records',
    label: 'RECORDS',
    items: [
      {
        href: '/items/claimed',
        label: 'Claimed Items',
        icon: CheckCircleIcon,
        matches: [/^\/items\/claimed$/],
      },
      {
        href: '/admin/reports',
        label: 'Reports',
        icon: BarChart2Icon,
        adminOnly: true,
        matches: [/^\/admin\/reports$/],
      },
      {
        href: '/admin/audit-logs',
        label: 'Audit Logs',
        icon: FileTextIcon,
        adminOnly: true,
        matches: [/^\/admin\/audit-logs$/],
      },
    ],
  },
  {
    key: 'system',
    label: 'SYSTEM',
    placement: 'bottom',
    items: [
      {
        href: '/admin/settings',
        label: 'Settings',
        icon: SettingsIcon,
        matches: [/^\/admin\/settings$/],
      },
      {
        href: '/admin/database',
        label: 'Database',
        icon: ShieldIcon,
        adminOnly: true,
        matches: [/^\/admin\/database$/, /^\/dashboard\/admin\/database$/, /^\/owner$/],
      },
      {
        href: '/',
        label: 'View Public Site',
        icon: ExternalLinkIcon,
        matches: [/^\/$/],
      },
      {
        href: '/logout',
        label: 'Logout',
        icon: LogOutIcon,
        danger: true,
        matches: [/^\/logout$/],
      },
    ],
  },
];

const dashboardTitleMap: Array<{ match: RegExp; title: string }> = [
  { match: /^\/dashboard$/, title: 'Dashboard Overview' },
  { match: /^\/items$/, title: 'Manage Items' },
  { match: /^\/items\/add$/, title: 'Add Found Item' },
  { match: /^\/items\/claimed$/, title: 'Claimed Items' },
  { match: /^\/items\/[^/]+$/, title: 'Item Details' },
  { match: /^\/items\/[^/]+\/edit$/, title: 'Edit Item' },
  { match: /^\/search$/, title: 'Search Items' },
  { match: /^\/admin\/users$/, title: 'Manage Users' },
  { match: /^\/admin\/reports$/, title: 'Reports' },
  { match: /^\/admin\/audit-logs$/, title: 'Audit Logs' },
  { match: /^\/admin\/settings$/, title: 'Settings' },
  { match: /^\/admin\/database$/, title: 'Database' },
  { match: /^\/dashboard\/admin\/database$/, title: 'Database' },
  { match: /^\/admin\/import$/, title: 'CSV Import' },
];

export function getDashboardTitle(pathname: string) {
  return dashboardTitleMap.find((item) => item.match.test(pathname))?.title ?? 'Dashboard';
}

export function isDashboardItemActive(pathname: string, item: DashboardNavItem) {
  return item.matches.some((match) => match.test(pathname));
}
