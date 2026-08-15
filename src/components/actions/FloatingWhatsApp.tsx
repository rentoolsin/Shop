import { useBottomBarHeight } from "../../hooks/useBottomBarHeight";

interface FloatingWhatsAppProps {
  phone: string; // digits only, country code included, e.g. "91XXXXXXXXXX"
  message?: string;
}

// Kept as the platform's own brand green rather than the app's monochrome
// graphite palette on purpose — this is a link out to a third-party service
// (like a payment-provider mark), not a themed in-app control, so it stays
// instantly recognizable as "open WhatsApp" regardless of light/dark mode.
const WHATSAPP_GREEN = "#25D366";

/**
 * Fixed floating action button, bottom-right, anchored within the app's
 * centered `max-w-app` column (same `fixed inset-x-0 … mx-auto max-w-app`
 * technique used by the install-banner/bottom-nav stack in App.tsx) so it
 * lines up with the mobile canvas instead of drifting to the true edge of
 * a wide desktop viewport. Clearance above the bottom bar rides on its
 * real measured height (see useBottomBarHeight) so it stays correct
 * whether or not the install banner is currently showing above the nav.
 */
export function FloatingWhatsApp({
  phone,
  message = "Hi RenTools, I'd like to ask about a tool rental.",
}: FloatingWhatsAppProps) {
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
        <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.2.2-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-2-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4a15.6 15.6 0 0 0 1.6.6c.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" />
        </svg>
      </a>
    </div>
  );
}
