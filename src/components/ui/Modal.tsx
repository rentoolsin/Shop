import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useDialogA11y } from "../../hooks/useDialogA11y";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
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
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded border border-graphite-200 bg-white p-5 shadow-raised outline-none dark:border-graphite-800 dark:bg-graphite-900"
      >
        <div className="mb-3 flex items-center justify-between">
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
        {children}
      </div>
    </div>,
    document.body,
  );
}
