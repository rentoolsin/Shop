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
 * The browser only checks an already-registered SW for updates on
 * navigation by default — easy to miss in a PWA/SPA where people leave a
 * tab (especially the admin panel) open for a long session without a full
 * reload. So this checks explicitly: once right on registration, then every
 * 15 seconds, and again whenever the tab regains focus — so a deploy shows
 * up within moments, not up to an hour later.
 *
 * Mount once, near the app root (see App.tsx) — it has no visual output of
 * its own, it just drives the toast.
 */
export function usePwaUpdate() {
  const { showToast } = useToast();
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        registration.update().catch(() => {
          // Offline or the update check failed — next check will retry.
        });
      };

      // Check immediately on registration, not just on the first interval
      // tick — a deploy that lands while someone (an admin especially,
      // where sessions run long) already has the app open should surface
      // within seconds, not sit unnoticed for up to an hour.
      checkForUpdate();

      // Frequent poll while the tab is open. Was 60 minutes, then 60
      // seconds — still not fast enough. Every browser tab now re-checks
      // for a new deploy this often; the request is just a fetch of the
      // tiny service-worker file, so it's cheap even this frequent.
      const POLL_MS = 15 * 1000;
      window.setInterval(checkForUpdate, POLL_MS);

      // Belt-and-braces: also re-check the moment the tab regains focus.
      // Covers someone who deploys while the admin has the tab backgrounded
      // or asleep on another monitor, rather than waiting for the next poll.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });
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
