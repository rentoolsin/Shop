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
 * Slim, dismissible install prompt. The public site and admin each render
 * this with their own `appId`/copy (see App.tsx and AdminMobileNav) — they
 * install as two separate home-screen apps (different manifest/scope/icon
 * per useManifestForRoute), so each needs its own `beforeinstallprompt`
 * gating and its own dismiss cooldown. Renders nothing until the browser
 * actually fires `beforeinstallprompt` (Chromium/Android/desktop Chrome
 * criteria met) and nothing once installed or dismissed — never an
 * unexplained empty band.
 */
export function InstallAppBanner({
  appId = "public",
  appName = "RenTools",
  tagline = "Add it to your home screen for quick access.",
  badgeLetter = "R",
  className = "",
}: InstallAppBannerProps) {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt(appId);

  if (!canInstall) return null;

  return (
    <div
      role="region"
      aria-label="Install app"
      className={["border-t border-graphite-200 bg-graphite-50 px-4 py-3 dark:border-graphite-800 dark:bg-graphite-950", className].join(" ")}
    >
      <div className="mx-auto flex max-w-app items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-graphite-300 font-display text-[15px] font-bold text-ink dark:border-graphite-700 dark:text-ink-inverted">
          {badgeLetter}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[13px] font-medium text-ink dark:text-ink-inverted">
            Install {appName}
          </p>
          <p className="truncate font-body text-[12px] text-graphite-500">{tagline}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={dismiss} aria-label="Dismiss install prompt">
          Not now
        </Button>
        <Button size="sm" onClick={promptInstall}>
          Install
        </Button>
      </div>
    </div>
  );
}
