import { useEffect, useState } from "react";
import { WifiSlash, WarningCircle } from "@phosphor-icons/react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/** Tracks connectivity so ErrorState can tell "you're offline" apart from
 * "something actually broke" — those need different next steps from the
 * person, and lumping them together as one generic message leaves them
 * guessing whether retrying is even worth trying. */
function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  const online = useOnlineStatus();

  const resolvedDescription =
    description ?? (online
      ? "Check your connection and try again."
      : "You're offline. Reconnect, then try again.");

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-graphite-100 text-graphite-400 dark:bg-graphite-800 dark:text-graphite-500"
      >
        {online ? (
          <WarningCircle className="h-5 w-5" weight="regular" />
        ) : (
          <WifiSlash className="h-5 w-5" weight="regular" />
        )}
      </span>
      <h3 className="font-display text-[16px] font-semibold text-ink dark:text-ink-inverted">
        {title ?? (online ? "Something didn't load" : "You're offline")}
      </h3>
      <p className="max-w-[30ch] font-body text-[14px] text-graphite-500">
        {resolvedDescription}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
