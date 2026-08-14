import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  BarChart3,
  ChevronRight as ChevronRightIcon,
  ClipboardList,
  LayoutGrid,
  LayoutTemplate,
  Settings as SettingsIcon,
} from "lucide-react";

export interface AdminMoreItem {
  to: string;
  label: string;
  description: string;
  icon: ReactNode;
}

const iconProps = { className: "h-[18px] w-[18px]", strokeWidth: 1.6 } as const;

/**
 * The destinations tucked away behind the "More" tab on mobile — same set
 * used by the full /admin/more page (AdminMore.tsx) and by the long-press
 * quick-pick sheet on the bottom nav (AdminMobileNav.tsx), so there's one
 * place to add a new "More" destination rather than two lists to keep in
 * sync.
 */
export const ADMIN_MORE_ITEMS: AdminMoreItem[] = [
  {
    to: "/admin/purchase-requests",
    label: "Purchase Requests",
    description: "Customer buy requests",
    icon: <ClipboardList {...iconProps} />,
  },
  {
    to: "/admin/categories",
    label: "Categories",
    description: "Product categories",
    icon: <LayoutGrid {...iconProps} />,
  },
  {
    to: "/admin/reports",
    label: "Reports",
    description: "Rentals & revenue",
    icon: <BarChart3 {...iconProps} />,
  },
  {
    to: "/admin/homepage",
    label: "Homepage",
    description: "Customer app content",
    icon: <LayoutTemplate {...iconProps} />,
  },
  {
    to: "/admin/settings",
    label: "Settings",
    description: "Contact numbers, appearance",
    icon: <SettingsIcon {...iconProps} />,
  },
];

function ChevronRight() {
  return <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-graphite-300" strokeWidth={1.6} aria-hidden="true" />;
}

/** A single "More" destination row — used both in the full More page list and the quick-pick sheet. */
export function AdminMoreLink({ to, label, description, icon, onNavigate }: AdminMoreItem & { onNavigate?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center gap-3 px-4 py-3.5 active:bg-graphite-50 dark:active:bg-graphite-800"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-graphite-100 text-graphite-600 dark:bg-graphite-800 dark:text-graphite-300">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-body text-[14px] font-medium text-ink dark:text-ink-inverted">{label}</span>
        <span className="block truncate font-body text-[12px] text-graphite-500">{description}</span>
      </span>
      <ChevronRight />
    </Link>
  );
}
