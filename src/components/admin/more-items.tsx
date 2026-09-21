import type { ReactNode } from "react";
import {
  ChartBar,
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
