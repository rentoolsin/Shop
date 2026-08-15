import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../actions/ThemeToggle";
import { useTheme } from "../../lib/theme";

interface MobileHeaderProps {
  /** Right-side slot, e.g. a search icon button. Kept sparse by design. */
  action?: ReactNode;
  contextLabel?: string; // e.g. "Coimbatore"
}

export function MobileHeader({ action, contextLabel }: MobileHeaderProps) {
  const { resolved } = useTheme();
  // Black mark reads cleanly on the light surface; the yellow mark keeps
  // brand presence (rather than washing out) against the dark surface.
  const markSrc = resolved === "dark" ? "/rentools-mark-yellow.png" : "/rentools-mark.png";

  return (
    <header className="sticky top-0 z-30 border-b border-graphite-200 bg-graphite-50/90 pt-safe-t backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-950/90">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={markSrc} alt="RenTools" className="h-8 w-8 flex-shrink-0 sm:h-9 sm:w-9" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[16.5px] font-extrabold tracking-tight text-ink dark:text-ink-inverted">
              RENTOOLS
            </span>
            <span className="mt-1 font-body text-[8.5px] font-semibold tracking-[0.16em] text-graphite-500">
              RENT · BUILD · ACHIEVE
            </span>
            {contextLabel && (
              <span className="mt-0.5 font-body text-[12px] text-graphite-500">
                {contextLabel}
              </span>
            )}
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {action}
        </div>
      </div>
    </header>
  );
}
