import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export interface AdminMoreItem {
  to: string;
  label: string;
  description: string;
  icon: ReactNode;
}

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
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path d="M4 3.5h9l3 3V16a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7 9h6M7 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/admin/categories",
    label: "Categories",
    description: "Product categories",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="3.5" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    to: "/admin/reports",
    label: "Reports",
    description: "Rentals & revenue",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path d="M4 16.5V9M10 16.5V3.5M16 16.5v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/admin/homepage",
    label: "Homepage",
    description: "Customer app content",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path d="M3 9.5 10 4l7 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 8.5v7a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/admin/settings",
    label: "Settings",
    description: "Contact numbers, appearance",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 3.5v1.6M10 14.9v1.6M16.5 10h-1.6M5.1 10H3.5M14.6 5.4l-1.13 1.13M6.53 13.47 5.4 14.6M14.6 14.6l-1.13-1.13M6.53 6.53 5.4 5.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 flex-shrink-0 text-graphite-300" aria-hidden="true">
      <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
