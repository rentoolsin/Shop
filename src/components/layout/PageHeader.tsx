import { CaretLeft } from "@phosphor-icons/react";
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-graphite-200/70 bg-graphite-50/85 px-2 pt-safe-t backdrop-blur-xl dark:border-graphite-800/70 dark:bg-graphite-950/85">
      <div className="flex min-w-0 items-center gap-1">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink transition-all duration-150 ease-app hover:bg-graphite-100 active:scale-90 dark:text-ink-inverted dark:hover:bg-graphite-800"
          >
            <CaretLeft className="h-5 w-5" weight="regular" />
          </button>
        )}
        <h1 className="truncate font-display text-[16px] font-semibold tracking-[-0.01em] text-ink dark:text-ink-inverted">
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}
