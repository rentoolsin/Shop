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
  const logoSrc = resolved === "dark" ? "/logo-yellow.png" : "/logo-black.png";

  return (
    <header className="sticky top-0 z-30 border-b border-graphite-200 bg-graphite-50/90 pt-safe-t backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-950/90">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-1.5">
          <img src={logoSrc} alt="RenTools" className="h-9 w-auto sm:h-10" />
          {contextLabel && (
            <span className="font-body text-[12px] text-graphite-500">
              {contextLabel}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {action}
        </div>
      </div>
    </header>
  );
}
