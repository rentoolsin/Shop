import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
  showBack?: boolean;
}

export function PageHeader({ title, action, showBack = true }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-graphite-200 bg-graphite-50/90 px-2 pt-safe-t backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-950/90">
      <div className="flex min-w-0 items-center gap-1">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-5 w-5">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1 className="truncate font-display text-[16px] font-semibold text-ink dark:text-ink-inverted">
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}
