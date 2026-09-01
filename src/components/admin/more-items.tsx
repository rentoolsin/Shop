import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  ChartBar,
  CaretRight as ChevronRightIcon,
  ClipboardText,
  SquaresFour,
  Layout,
  MapPin,
  Gear as SettingsIcon,
} from "@phosphor-icons/react";

export interface AdminMoreItem {
  to: string;
  label: string;
  description: string;
  icon: ReactNode;
}

const iconProps = { className: "h-[18px] w-[18px]", weight: "light" } as const;

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
    icon: <ClipboardText {...iconProps} />,
  },
  {
    to: "/admin/categories",
    label: "Categories",
    description: "Product categories",
    icon: <SquaresFour {...iconProps} />,
  },
  {
    to: "/admin/locations",
    label: "Locations",
    description: "Delivery cities",
    icon: <MapPin {...iconProps} />,
  },
  {
    to: "/admin/reports",
    label: "Reports",
    description: "Rentals & revenue",
    icon: <ChartBar {...iconProps} />,
  },
  {
    to: "/admin/homepage",
    label: "Homepage",
    description: "Customer app content",
    icon: <Layout {...iconProps} />,
  },
  {
    to: "/admin/settings",
    label: "Settings",
    description: "Contact numbers, appearance",
    icon: <SettingsIcon {...iconProps} />,
  },
];

function ChevronRight() {
  return <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-graphite-300" weight="light" aria-hidden="true" />;
}

/** A single "More" destination row — used both in the full More page list and the quick-pick sheet. */
export function AdminMoreLink({
  to,
  label,
  description,
  icon,
  badgeCount,
  onNavigate,
}: AdminMoreItem & { badgeCount?: number; onNavigate?: () => void }) {
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
      {!!badgeCount && badgeCount > 0 && (
        <span
          aria-label={`${badgeCount} open`}
          className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-state-danger px-1.5 font-body text-[11px] font-semibold leading-none text-white"
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
      <ChevronRight />
    </Link>
  );
}
