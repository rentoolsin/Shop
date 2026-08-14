// Shared line-icon set for admin navigation surfaces (sidebar + mobile tab bar).
// Kept separate so icon markup for shared destinations (Dashboard, Rentals,
// Enquiries, Products, Customers) isn't duplicated between AdminLayout and
// AdminMobileNav.
//
// Thin wrappers around Lucide icons so call sites keep using the same
// component names and `size` prop regardless of which icon set backs them.

import {
  ClipboardList,
  Home,
  LayoutGrid,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";

interface IconProps {
  size?: number;
}

export function HomeIcon({ size = 18 }: IconProps) {
  return <Home size={size} strokeWidth={1.6} />;
}

export function RequestsIcon({ size = 18 }: IconProps) {
  return <ClipboardList size={size} strokeWidth={1.6} />;
}

export function RentalsIcon({ size = 18 }: IconProps) {
  return <Warehouse size={size} strokeWidth={1.6} />;
}

export function CustomersIcon({ size = 18 }: IconProps) {
  return <Users size={size} strokeWidth={1.6} />;
}

export function ProductsIcon({ size = 18 }: IconProps) {
  return <Wrench size={size} strokeWidth={1.6} />;
}

export function MoreIcon({ size = 18 }: IconProps) {
  return <LayoutGrid size={size} strokeWidth={1.6} />;
}
