import { useEffect, useState } from "react";

const DISMISSED_KEY = "rentools-install-dismissed-at";
// Re-offer the banner after a cooldown rather than never again — someone who
// dismissed it once may still want to install later, but re-prompting every
// visit is the kind of nagging this design system explicitly avoids.
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own standalone flag (no beforeinstallprompt support there)
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function wasRecentlyDismissed(): boolean {
  const raw = window.localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

/**
 * Wraps the browser's `beforeinstallprompt` flow. Chromium-based browsers
 * fire this once the PWA install criteria (manifest + service worker +
 * HTTPS) are met; Safari/iOS never fires it (there's no programmatic
 * install prompt there — "Add to Home Screen" is a manual Share-sheet
 * action), so `canInstall` simply stays false there and callers should not
 * show an install affordance on iOS beyond documentation/instructions.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed);

  useEffect(() => {
    if (isStandalone()) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // Whether accepted or dismissed, the captured event is one-shot — the
    // browser won't let it be re-prompted, so clear it either way.
    setDeferredPrompt(null);
    if (outcome === "dismissed") {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      setDismissed(true);
    }
  };

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setDismissed(true);
  };

  return {
    canInstall: !!deferredPrompt && !installed && !dismissed,
    installed,
    promptInstall,
    dismiss,
  };
}
