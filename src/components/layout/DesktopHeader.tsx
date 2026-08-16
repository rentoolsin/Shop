import { Heart, MagnifyingGlass, ShoppingCart } from "@phosphor-icons/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "../actions/ThemeToggle";
import { useTheme } from "../../lib/theme";
import { useCart } from "../../hooks/useCart";
import { useSavedProducts } from "../../hooks/useSavedProducts";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Tools" },
  { to: "/enquire", label: "Enquire" },
  { to: "/request-purchase", label: "Request a tool" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

/** Fixed 1280px content column, centered — shared by every desktop section
 *  so headings/grids line up under this header. */
export function DesktopContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-[1280px] px-10 ${className}`}>{children}</div>;
}

/**
 * Persistent top bar for the desktop (`md:` and up) layout — replaces the
 * mobile `MobileHeader`/`PageHeader` + `BottomNavigation` combo entirely on
 * wide viewports. Rendered once in `App.tsx` so every route gets nav and
 * cart/saved counts without each page re-declaring them (this is what
 * `DesktopHome`'s header was refactored out into). Search lives on its own
 * dedicated /search page rather than inline here — the header icon just
 * opens it. Call/WhatsApp aren't in the header — WhatsApp is a floating
 * action button (see FloatingWhatsApp) and Call/WhatsApp CTAs live inline
 * further down the homepage instead.
 */
export function DesktopHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolved } = useTheme();
  const logoSrc = resolved === "dark" ? "/logo-yellow.png" : "/logo-black.png";

  const { totalItems: cartCount } = useCart();
  const { ids: savedIds } = useSavedProducts();

  return (
    <header className="sticky top-0 z-30 border-b border-graphite-200 bg-graphite-50/90 backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-950/90">
      <DesktopContainer className="flex h-20 items-center gap-8">
        <Link to="/" className="flex flex-shrink-0 items-center">
          <img src={logoSrc} alt="RenTools" className="h-12 w-auto" />
        </Link>

        <nav aria-label="Primary" className="flex flex-shrink-0 items-center gap-6">
          {NAV_LINKS.map((link) => {
            const active = link.to === "/" ? location.pathname === "/" : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? "page" : undefined}
                className={`font-body text-[14.5px] font-medium transition-colors ${
                  active
                    ? "text-ink dark:text-ink-inverted"
                    : "text-graphite-600 hover:text-ink dark:text-graphite-300 dark:hover:text-ink-inverted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex flex-shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/search")}
            aria-label="Search tools"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
          >
            <MagnifyingGlass className="h-5 w-5" weight="regular" />
          </button>
          <Link
            to="/saved"
            aria-label={`Saved tools${savedIds.length > 0 ? ` (${savedIds.length})` : ""}`}
            className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
          >
            <Heart className="h-5 w-5" weight="regular" />
            {savedIds.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 font-body text-[10px] font-semibold leading-none text-white">
                {savedIds.length > 99 ? "99+" : savedIds.length}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            aria-label={`Cart${cartCount > 0 ? ` (${cartCount})` : ""}`}
            className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
          >
            <ShoppingCart className="h-5 w-5" weight="regular" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 font-body text-[10px] font-semibold leading-none text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <div className="mx-1 h-6 w-px bg-graphite-200 dark:bg-graphite-800" />
          <ThemeToggle />
        </div>
      </DesktopContainer>
    </header>
  );
}
