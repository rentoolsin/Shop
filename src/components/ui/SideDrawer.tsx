import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useDialogA11y } from "../../hooks/useDialogA11y";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Off-canvas drawer anchored to the left edge — same overlay mechanics as
 * BottomSheet (portalled to <body>, scroll-locked, Escape/focus-trapped via
 * useDialogA11y) but slides in horizontally instead of up, for the
 * hamburger nav menu where a vertical link list reads more naturally as a
 * side panel than a bottom sheet.
 */
export function SideDrawer({ open, onClose, title, children }: SideDrawerProps) {
  useScrollLock(open);
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogA11y(open, containerRef, onClose);

  if (!open) return null;

  // Portalled for the same reason as BottomSheet (see its comment): pages
  // render inside PageTransition's transformed wrapper, which would
  // otherwise clip/contain a `fixed` backdrop to that wrapper's box
  // instead of the real viewport.
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-start bg-black/40" onClick={onClose}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={[
          "flex h-full w-[82%] max-w-[320px] flex-col overflow-y-auto border-r border-graphite-200 bg-white pt-safe-t outline-none",
          "dark:border-graphite-800 dark:bg-graphite-900",
          "animate-drawer-in",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          {title && (
            <h2
              id="drawer-title"
              className="font-display text-[16px] font-semibold text-ink dark:text-ink-inverted"
            >
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-graphite-500 transition-all duration-150 ease-app hover:bg-graphite-100 active:scale-90 dark:hover:bg-graphite-800"
          >
            <X className="h-5 w-5" weight="regular" />
          </button>
        </div>
        <div className="flex-1 px-3 pb-6 pt-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
