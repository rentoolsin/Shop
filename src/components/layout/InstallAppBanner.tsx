import { X } from "@phosphor-icons/react";
import { useInstallPrompt, type InstallAppId } from "../../hooks/useInstallPrompt";
import { Button } from "../ui/Button";

interface InstallAppBannerProps {
  /** Which install prompt/dismiss-cooldown to track — the public site and admin are separate installable apps. */
  appId?: InstallAppId;
  appName?: string;
  tagline?: string;
  /** Single letter shown in the placeholder badge. */
  badgeLetter?: string;
  className?: string;
}

/**
 * Floating, dismissible install-prompt card. The public site and admin each
 * render this with their own `appId`/copy (see App.tsx and AdminMobileNav) —
 * they install as two separate home-screen apps (different manifest/scope/
 * icon per useManifestForRoute), so each needs its own `beforeinstallprompt`
 * gating and its own dismiss cooldown. Renders nothing until the browser
 * actually fires `beforeinstallprompt` (Chromium/Android/desktop Chrome
 * criteria met) and nothing once installed or dismissed — never an
 * unexplained empty card.
 */
export function InstallAppBanner({
  appId = "public",
  appName = "RenTools",
  tagline = "Add it to your home screen for a faster, app-like experience.",
  badgeLetter = "R",
  className = "",
}: InstallAppBannerProps) {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt(appId);

  if (!canInstall) return null;

  return (
    <div
      role="region"
      aria-label="Install app"
      className={[
        "animate-sheet-in mx-3 mb-3 rounded border border-graphite-200 bg-white p-3.5 shadow-raised",
        "dark:border-graphite-800 dark:bg-graphite-900",
        className,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded bg-graphite-900 font-display text-[16px] font-bold text-graphite-25 dark:bg-white dark:text-graphite-950">
          {badgeLetter}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-body text-[13.5px] font-semibold leading-snug text-ink dark:text-ink-inverted">
            Install {appName}
          </p>
          <p className="mt-0.5 font-body text-[12px] leading-snug text-graphite-500">{tagline}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="-mr-2 -mt-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-graphite-400 transition-colors duration-150 ease-app active:bg-graphite-100 active:text-ink dark:active:bg-graphite-800 dark:active:text-ink-inverted"
        >
          <X className="h-4 w-4" weight="regular" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 pl-[56px]">
        <Button size="sm" onClick={promptInstall}>
          Install
        </Button>
        <Button variant="ghost" size="sm" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}
