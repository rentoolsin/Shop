import { useBottomBarHeight } from "../../hooks/useBottomBarHeight";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";

interface FloatingWhatsAppProps {
  phone: string; // digits only, country code included, e.g. "91XXXXXXXXXX"
  message?: string;
}

// Kept as the platform's own brand green rather than the app's monochrome
// graphite palette on purpose — this is a link out to a third-party service
// (like a payment-provider mark), not a themed in-app control, so it stays
// instantly recognizable as "open WhatsApp" regardless of light/dark mode.
const WHATSAPP_GREEN = "#25D366";
const DEFAULT_MESSAGE = "Hi RenTools, I'd like to ask about a tool rental.";

/**
 * Fixed floating action button, bottom-right, anchored within the app's
 * centered `max-w-app` column (same `fixed inset-x-0 … mx-auto max-w-app`
 * technique used by the install-banner/bottom-nav stack in App.tsx) so it
 * lines up with the mobile canvas instead of drifting to the true edge of
 * a wide desktop viewport. Clearance above the bottom bar rides on its
 * real measured height (see useBottomBarHeight) so it stays correct
 * whether or not the install banner is currently showing above the nav.
 *
 * Mobile-only — see `FloatingWhatsAppDesktop` for the `md:` and up
 * equivalent, which doesn't need any of the bottom-nav-clearance logic
 * since there's no bottom nav to clear on desktop.
 */
export function FloatingWhatsApp({ phone, message = DEFAULT_MESSAGE }: FloatingWhatsAppProps) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  const bottomBarHeight = useBottomBarHeight();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-app"
      style={{
        bottom:
          bottomBarHeight > 0
            ? `calc(${bottomBarHeight}px + 16px)`
            : "calc(5.75rem + env(safe-area-inset-bottom))",
      }}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="pointer-events-auto absolute bottom-0 right-4 flex h-14 w-14 items-center justify-center rounded-full shadow-raised transition-transform duration-150 ease-app hover:scale-105 active:scale-95"
        style={{ backgroundColor: WHATSAPP_GREEN }}
      >
        <WhatsAppIcon className="h-7 w-7 text-white" />
      </a>
    </div>
  );
}

/**
 * Desktop equivalent of FloatingWhatsApp — since the desktop header dropped
 * its inline Call/WhatsApp buttons, this is the only WhatsApp entry point
 * on wide viewports, so it stays visible everywhere the header does.
 * Anchored to the true viewport corner (not the mobile `max-w-app` column,
 * and no bottom-nav clearance to account for, since neither exists at
 * `md:` and up).
 */
export function FloatingWhatsAppDesktop({ phone, message = DEFAULT_MESSAGE }: FloatingWhatsAppProps) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-raised transition-transform duration-150 ease-app hover:scale-105 active:scale-95"
      style={{ backgroundColor: WHATSAPP_GREEN }}
    >
      <WhatsAppIcon className="h-7 w-7 text-white" />
    </a>
  );
}

