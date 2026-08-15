import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useToast } from "../components/ui/Toast";

/**
 * Surfaces new deployments to users who already have the app open/installed.
 *
 * `registerType: "prompt"` (vite.config.ts) means a new service worker
 * installs and waits in the background instead of silently taking over —
 * this hook is what turns that wait into a "New version available" toast the
 * user can act on, rather than either (a) nothing happening until they
 * happen to fully reload, or (b) the page yanking itself out from under them
 * mid-session.
 *
 * Mount once, near the app root (see App.tsx) — it has no visual output of
 * its own, it just drives the toast.
 */
export function usePwaUpdate() {
  const { showToast } = useToast();
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Chrome/Edge/etc. only re-check an already-registered SW for updates
      // on navigation by default, which is easy to miss in a PWA where
      // people don't often do a hard refresh. Poll explicitly so a user who
      // leaves the app open in the background still gets offered the update.
      if (!registration) return;
      const HOUR_MS = 60 * 60 * 1000;
      window.setInterval(() => {
        registration.update().catch(() => {
          // Offline or the update check failed — next interval will retry.
        });
      }, HOUR_MS);
    },
  });

  useEffect(() => {
    if (!needRefresh[0]) return;
    showToast("A new version of RenTools is available.", "default", {
      persist: true,
      action: {
        label: "Refresh",
        onClick: () => {
          void updateServiceWorker(true);
        },
      },
    });
    // Only fire when needRefresh flips to true, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh[0]]);
}
