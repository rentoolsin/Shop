// Shared line-icon set for admin navigation surfaces (sidebar + mobile tab bar).
// Kept separate so icon markup for shared destinations (Dashboard, Rentals,
// Enquiries, Products, Customers) isn't duplicated between AdminLayout and
// AdminMobileNav.
//
// `size` defaults to 18 (the sidebar's presentation) but can be bumped per
// call site — e.g. the mobile tab bar renders these a touch larger since
// they're the only label there's room to read at that density.

interface IconProps {
  size?: number;
}

export function HomeIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.6" style={{ width: size, height: size }}>
      <path d="M3 10.5 10 4l7 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9v6.5a.5.5 0 0 0 .5.5H8a.5.5 0 0 0 .5-.5V12a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v3.5a.5.5 0 0 0 .5.5h2.5a.5.5 0 0 0 .5-.5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RequestsIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.6" style={{ width: size, height: size }}>
      <path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h10a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 15 14H8l-3.5 2.5V14H5A1.5 1.5 0 0 1 3.5 12.5v-7Z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

export function RentalsIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.6" style={{ width: size, height: size }}>
      <rect x="3.5" y="5" width="13" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 3v3M13.5 3v3M3.5 8.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CustomersIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.6" style={{ width: size, height: size }}>
      <circle cx="10" cy="7" r="2.75" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 16c0-2.9 2.7-5 6-5s6 2.1 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ProductsIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.6" style={{ width: size, height: size }}>
      <path d="M10 3 3.5 6.5 10 10l6.5-3.5L10 3Z" stroke="currentColor" strokeLinejoin="round" />
      <path d="M3.5 6.5V13L10 16.5M16.5 6.5V13L10 16.5M10 10v6.5" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

export function MoreIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.6" style={{ width: size, height: size }}>
      <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
