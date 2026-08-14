import { useRef, type ReactNode } from "react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useDialogA11y } from "../../hooks/useDialogA11y";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useScrollLock(open);
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogA11y(open, containerRef, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-app" onClick={(e) => e.stopPropagation()}>
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "sheet-title" : undefined}
          tabIndex={-1}
          className={[
            "max-h-[85vh] overflow-y-auto rounded-t-lg border-t border-graphite-200 bg-white outline-none",
            "pb-safe-b dark:border-graphite-800 dark:bg-graphite-900",
            "animate-sheet-in",
          ].join(" ")}
        >
          <div className="flex justify-center pt-2.5">
            <span className="h-1 w-9 rounded-full bg-graphite-300 dark:bg-graphite-700" />
          </div>
          {title && (
            <h2
              id="sheet-title"
              className="px-5 pt-3 font-display text-[16px] font-semibold text-ink dark:text-ink-inverted"
            >
              {title}
            </h2>
          )}
          <div className="px-5 pb-6 pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
