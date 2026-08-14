import { useEffect, useState } from "react";

// "public" keeps the original, un-namespaced key so anyone who already
// dismissed the customer-app banner before the admin app existed keeps that
// cooldown rather than getting re-prompted right away.
function dismissedKey(appId: InstallAppId): string {
  return appId === "public" ? "rentools-install-dismissed-at" : `rentools-install-dismissed-at-${appId}`;
}
// Re-offer the banner after a cooldown rather than never again — someone who
// dismissed it once may still want to install later, but re-prompting every
// visit is the kind of nagging this design system explicitly avoids.
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export type InstallAppId = "public" | "admin";

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

function wasRecentlyDismissed(appId: InstallAppId): boolean {
  const raw = window.localStorage.getItem(dismissedKey(appId));
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

// --- Module-scope capture -------------------------------------------------
// `beforeinstallprompt` fires exactly once and is easy to miss: it can arrive
// before React has mounted anything, and on admin it can arrive while the
// user is on `/admin/login` — a route that renders outside `AdminLayout` and
// so never mounts `AdminMobileNav`/`InstallAppBanner` at all. Attaching the
// listener inside a component's `useEffect` only works if that exact
// component happens to be mounted at the moment the browser decides to fire.
//
// Instead we register the listener here, at the top of the module, which
// runs the instant this file is evaluated — i.e. during initial script
// execution, before `createRoot().render()` ever runs (this module is
// statically imported from `App.tsx`, which `main.tsx` imports directly, so
// it's part of the very first synchronous import chain, not a lazy chunk).
// Every `useInstallPrompt()` call anywhere in the tree reads the same shared
// state, so it doesn't matter which route/component mounts first or last —
// nothing gets missed.
const singleton: { deferredPrompt: BeforeInstallPromptEvent | null; installed: boolean } = {
  deferredPrompt: null,
  installed: isStandalone(),
};
const subscribers = new Set<() => void>();
function emit() {
  subscribers.forEach((notify) => notify());
}

if (typeof window !== "undefined" && !singleton.installed) {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    singleton.deferredPrompt = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    singleton.installed = true;
    singleton.deferredPrompt = null;
    emit();
  });
}
// ---------------------------------------------------------------------------

/**
 * Wraps the browser's `beforeinstallprompt` flow. Chromium-based browsers
 * fire this once the PWA install criteria (manifest + service worker +
 * HTTPS) are met; Safari/iOS never fires it (there's no programmatic
 * install prompt there — "Add to Home Screen" is a manual Share-sheet
 * action), so `canInstall` simply stays false there and callers should not
 * show an install affordance on iOS beyond documentation/instructions.
 */
export function useInstallPrompt(appId: InstallAppId = "public") {
  // Cheap re-render trigger: the actual event state lives on `singleton`
  // (see above) so every hook instance reflects the same captured prompt,
  // no matter when it mounted relative to the event firing.
  const [, setTick] = useState(0);
  const [dismissed, setDismissed] = useState(() => wasRecentlyDismissed(appId));

  useEffect(() => {
    const notify = () => setTick((t) => t + 1);
    subscribers.add(notify);
    return () => {
      subscribers.delete(notify);
    };
  }, []);

  const promptInstall = async () => {
    if (!singleton.deferredPrompt) return;
    const { deferredPrompt } = singleton;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // Whether accepted or dismissed, the captured event is one-shot — the
    // browser won't let it be re-prompted, so clear it either way.
    singleton.deferredPrompt = null;
    emit();
    if (outcome === "dismissed") {
      window.localStorage.setItem(dismissedKey(appId), String(Date.now()));
      setDismissed(true);
    }
  };

  const dismiss = () => {
    window.localStorage.setItem(dismissedKey(appId), String(Date.now()));
    setDismissed(true);
  };

  return {
    canInstall: !!singleton.deferredPrompt && !singleton.installed && !dismissed,
    installed: singleton.installed,
    promptInstall,
    dismiss,
  };
}
