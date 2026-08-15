import { Envelope, MapPin, Phone } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useTheme } from "../../lib/theme";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../../utils/site-settings";
import { getDirectionsUrl } from "../../utils/geo";

const EXPLORE_LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Tools" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const SUPPORT_LINKS = [
  { to: "/enquire", label: "Send an enquiry" },
  { to: "/request-purchase", label: "Request a tool" },
  { to: "/search", label: "Search tools" },
];

/**
 * Site-wide footer for the customer app. Sits at the end of each page's
 * scrollable content (above the fixed bottom nav's own spacing), pulling
 * brand + contact details from the same sources the rest of the app uses
 * (theme-aware logo, `useSiteSettings`) so it never drifts out of sync
 * with Contact/Home.
 */
export function Footer() {
  const { resolved } = useTheme();
  const logoSrc = resolved === "dark" ? "/logo-yellow.png" : "/logo-black.png";

  const settings = useSiteSettings();
  const { phone, whatsapp, email, address, latitude, longitude } =
    settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;
  // Coordinate-based directions link is more accurate than an address
  // text search — see utils/geo.ts and site_settings.latitude/longitude.
  const mapsUrl = getDirectionsUrl(latitude, longitude);

  return (
    <footer className="mt-10 border-t border-graphite-200 bg-graphite-100/60 dark:border-graphite-800 dark:bg-graphite-900/40">
      <div className="mx-auto max-w-app px-5 py-8 md:max-w-[1280px] md:px-10 md:py-14">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:grid-cols-[1.3fr_1fr_1fr_1.3fr] md:gap-14">
          {/* Brand */}
          <div className="col-span-2 space-y-3 sm:col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center">
              <img src={logoSrc} alt="RenTools" className="h-11 w-auto sm:h-12 md:h-14" />
            </Link>
            <p className="max-w-[30ch] font-body text-[13px] leading-relaxed text-graphite-500 md:text-[14px]">
              Construction tool &amp; equipment rental in Coimbatore — daily rates, quick
              enquiries, reliable pickup.
            </p>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded bg-accent-500 px-3.5 py-2 font-body text-[12.5px] font-semibold text-graphite-950 shadow-[0_2px_8px_-2px_rgba(240,168,27,0.55)] transition-all hover:bg-accent-400 active:scale-95 md:px-4 md:py-2.5 md:text-[13.5px]"
            >
              Chat on WhatsApp
            </a>
          </div>

          {/* Explore */}
          <nav aria-label="Explore">
            <h2 className="font-display text-[12px] font-semibold uppercase tracking-[0.06em] text-graphite-400 md:text-[12.5px]">
              Explore
            </h2>
            <ul className="mt-3 space-y-2.5 md:mt-4 md:space-y-3">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="font-body text-[13.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400 md:text-[14.5px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support */}
          <nav aria-label="Support">
            <h2 className="font-display text-[12px] font-semibold uppercase tracking-[0.06em] text-graphite-400 md:text-[12.5px]">
              Support
            </h2>
            <ul className="mt-3 space-y-2.5 md:mt-4 md:space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="font-body text-[13.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400 md:text-[14.5px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact — desktop-only column so contact details sit in the
              same row as Explore/Support instead of stacking full-width
              below (see the mobile-only block further down, which stays
              exactly as it was). */}
          <div className="hidden md:block">
            <h2 className="font-display text-[12.5px] font-semibold uppercase tracking-[0.06em] text-graphite-400">
              Contact
            </h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 font-body text-[14.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
                >
                  <Phone className="h-4 w-4 flex-shrink-0 text-graphite-400" weight="regular" />
                  {phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 font-body text-[14.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
                >
                  <Envelope className="h-4 w-4 flex-shrink-0 text-graphite-400" weight="regular" />
                  {email}
                </a>
              </li>
              <li>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 font-body text-[14.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
                >
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-graphite-400" weight="regular" />
                  {address}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact details — mobile/tablet only; folded into its own
            grid column above at md: (see "Contact" block). */}
        <div className="mt-8 space-y-2.5 border-t border-graphite-200 pt-6 dark:border-graphite-800 md:hidden">
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2 font-body text-[13.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
          >
            <Phone className="h-4 w-4 flex-shrink-0 text-graphite-400" weight="regular" />
            {phone}
          </a>
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 font-body text-[13.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
          >
            <Envelope className="h-4 w-4 flex-shrink-0 text-graphite-400" weight="regular" />
            {email}
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 font-body text-[13.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
          >
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-graphite-400" weight="regular" />
            {address}
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-7 flex flex-col-reverse items-center gap-3 border-t border-graphite-200 pt-5 sm:flex-row sm:justify-between dark:border-graphite-800 md:mt-10 md:pt-7">
          <p className="font-body text-[12px] text-graphite-400 md:text-[13px]">
            © {new Date().getFullYear()} RenTools. All rights reserved.
          </p>
          <p className="font-body text-[12px] text-graphite-400 md:text-[13px]">Coimbatore, Tamil Nadu</p>
        </div>
      </div>
    </footer>
  );
}
