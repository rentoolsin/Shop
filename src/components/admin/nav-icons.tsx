// Shared line-icon set for admin navigation surfaces (sidebar + mobile tab bar).
// Kept separate so icon markup for shared destinations (Dashboard, Rentals,
// Enquiries, Products, Customers) isn't duplicated between AdminLayout and
// AdminMobileNav.
//
// Thin wrappers around Lucide icons so call sites keep using the same
// component names and `size` prop regardless of which icon set backs them.

import {
  ClipboardText,
  House,
  SquaresFour,
  Users,
  Warehouse,
  Wrench,
} from "@phosphor-icons/react";

interface IconProps {
  size?: number;
}

export function HomeIcon({ size = 18 }: IconProps) {
  return <House size={size} weight="light" />;
}

export function RequestsIcon({ size = 18 }: IconProps) {
  return <ClipboardText size={size} weight="light" />;
}

export function RentalsIcon({ size = 18 }: IconProps) {
  return <Warehouse size={size} weight="light" />;
}

export function CustomersIcon({ size = 18 }: IconProps) {
  return <Users size={size} weight="light" />;
}

export function ProductsIcon({ size = 18 }: IconProps) {
  return <Wrench size={size} weight="light" />;
}

export function MoreIcon({ size = 18 }: IconProps) {
  return <SquaresFour size={size} weight="light" />;
}
