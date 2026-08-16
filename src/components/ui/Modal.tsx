import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useDialogA11y } from "../../hooks/useDialogA11y";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /**
   * Dialog width on `sm:` and up. Defaults to "sm" (the original 384px
   * cap) so existing callers (ConfirmDialog, product/rental "view" popups)
   * are unaffected. Use "md"/"lg" for content-heavy forms — e.g. the
   * rentals edit and payment-history dialogs — so they get real breathing
   * room on desktop instead of the same phone-width column stretched tall.
   */
  size?: ModalSize;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md md:max-w-lg",
  lg: "sm:max-w-lg md:max-w-2xl",
};

export function Modal({ open, onClose, title, children, size = "sm" }: ModalProps) {
  useScrollLock(open);
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogA11y(open, containerRef, onClose);

  if (!open) return null;

  // Portalled to document.body — see the matching comment in BottomSheet.tsx.
  // Rendered in place, this "fixed inset-0" backdrop is confined to
  // PageTransition's transformed wrapper instead of the real viewport, so
  // it fails to cover/dim page content that sits outside that wrapper
  // (e.g. <Footer/>). Every Modal user (including ConfirmDialog) gets the
  // fix automatically.
  //
  // Layout: on phones the dialog sits flush to the viewport edges and its
  // own body scrolls internally (`max-h-[100dvh]` + `overflow-y-auto` on
  // the panel), so a long form (e.g. "Record a payment" below a payment
  // history list) never gets clipped under the browser chrome the way a
  // plain `items-center` dialog does. From `sm:` up it becomes a normal
  // centered dialog capped by `size`, with its own internal scroll region
  // once content exceeds ~85% of the viewport height, so the header and
  // Cancel/Save actions stay reachable without the whole page scrolling.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={[
          "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t border border-graphite-200 bg-white shadow-raised outline-none",
          "sm:max-h-[85dvh] sm:rounded",
          "dark:border-graphite-800 dark:bg-graphite-900",
          SIZE_CLASSES[size],
        ].join(" ")}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-graphite-100 px-5 py-4 dark:border-graphite-800">
          <h2
            id="modal-title"
            className="font-display text-[16px] font-semibold text-ink dark:text-ink-inverted"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-graphite-500 hover:bg-graphite-100 dark:hover:bg-graphite-800"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
