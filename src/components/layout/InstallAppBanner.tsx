import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { Button } from "../ui/Button";

/**
 * Slim, dismissible install prompt shown above BottomNavigation on the
 * public app only (see App.tsx — admin has its own layout and isn't a
 * customer-facing install surface). Renders nothing until the browser
 * actually fires `beforeinstallprompt` (Chromium/Android/desktop Chrome
 * criteria met) and nothing once installed or dismissed — never an
 * unexplained empty band.
 */
export function InstallAppBanner() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      role="region"
      aria-label="Install app"
      className="border-t border-graphite-200 bg-graphite-50 px-4 py-3 dark:border-graphite-800 dark:bg-graphite-950"
    >
      <div className="mx-auto flex max-w-app items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-signal-500/50 font-display text-[15px] font-bold text-signal-600 dark:text-signal-400">
          R
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[13px] font-medium text-ink dark:text-ink-inverted">
            Install RenTools
          </p>
          <p className="truncate font-body text-[12px] text-graphite-500">
            Add it to your home screen for quick access.
          </p>
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
