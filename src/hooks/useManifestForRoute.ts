import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Admin and the public site are installable as two separate PWAs — different
 * name, icon, and scope — so they need to end up as two separate home-screen
 * entries rather than one "RenTools" install covering both. vite-plugin-pwa
 * only injects a single `<link rel="manifest">`, so this repoints it at
 * `/admin-manifest.webmanifest` or `/manifest.webmanifest` to match whichever
 * section is currently active, before the browser evaluates installability
 * (and before `beforeinstallprompt` can fire) for that section.
 *
 * No-op on the dev server: the PWA plugin is disabled there
 * (`devOptions.enabled: false`), so there's no manifest link to swap and no
 * install prompt to test outside a production build anyway.
 */
export function useManifestForRoute() {
  const { pathname } = useLocation();

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) return;
    link.href = pathname.startsWith("/admin") ? "/admin-manifest.webmanifest" : "/manifest.webmanifest";
  }, [pathname]);
}
