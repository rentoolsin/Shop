import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../lib/theme";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../../utils/site-settings";

const EXPLORE_LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Tools" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const SUPPORT_LINKS = [
  { to: "/enquire", label: "Send an enquiry" },
  { to: "/request-purchase", label: "Request purchase" },
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
  const { phone, whatsapp, email, address } =
    settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "RenTools, " + address,
  )}`;

  return (
    <footer className="mt-10 border-t border-graphite-200 bg-graphite-100/60 dark:border-graphite-800 dark:bg-graphite-900/40">
      <div className="mx-auto max-w-app px-5 py-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center">
              <img src={logoSrc} alt="RenTools" className="h-11 w-auto sm:h-12" />
            </Link>
            <p className="max-w-[30ch] font-body text-[13px] leading-relaxed text-graphite-500">
              Construction tool &amp; equipment rental in Coimbatore — daily rates, quick
              enquiries, reliable pickup.
            </p>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded bg-accent-500 px-3.5 py-2 font-body text-[12.5px] font-semibold text-graphite-950 shadow-[0_2px_8px_-2px_rgba(240,168,27,0.55)] transition-all active:scale-95"
            >
              Chat on WhatsApp
            </a>
          </div>

          {/* Explore */}
          <nav aria-label="Explore">
            <h2 className="font-display text-[12px] font-semibold uppercase tracking-[0.06em] text-graphite-400">
              Explore
            </h2>
            <ul className="mt-3 space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="font-body text-[13.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support */}
          <nav aria-label="Support">
            <h2 className="font-display text-[12px] font-semibold uppercase tracking-[0.06em] text-graphite-400">
              Support
            </h2>
            <ul className="mt-3 space-y-2.5">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="font-body text-[13.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Contact details */}
        <div className="mt-8 space-y-2.5 border-t border-graphite-200 pt-6 dark:border-graphite-800">
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2 font-body text-[13.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
          >
            <Phone className="h-4 w-4 flex-shrink-0 text-graphite-400" strokeWidth={1.8} />
            {phone}
          </a>
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 font-body text-[13.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
          >
            <Mail className="h-4 w-4 flex-shrink-0 text-graphite-400" strokeWidth={1.8} />
            {email}
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 font-body text-[13.5px] text-ink transition-colors hover:text-accent-600 dark:text-ink-inverted dark:hover:text-accent-400"
          >
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-graphite-400" strokeWidth={1.8} />
            {address}
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-7 flex flex-col-reverse items-center gap-3 border-t border-graphite-200 pt-5 sm:flex-row sm:justify-between dark:border-graphite-800">
          <p className="font-body text-[12px] text-graphite-400">
            © {new Date().getFullYear()} RenTools. All rights reserved.
          </p>
          <p className="font-body text-[12px] text-graphite-400">Coimbatore, Tamil Nadu</p>
        </div>
      </div>
    </footer>
  );
}
