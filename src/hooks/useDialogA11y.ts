import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared keyboard/focus behavior for overlay dialogs (Modal, BottomSheet,
 * and anything built on top of them, e.g. ConfirmDialog): closes on
 * Escape, moves focus into the dialog on open, keeps Tab/Shift+Tab
 * cycling within it while open, and restores focus to whatever triggered
 * it on close. Defined once here so every overlay gets the same behavior
 * rather than each dialog reimplementing it.
 */
export function useDialogA11y(open: boolean, containerRef: RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    const triggerElement = document.activeElement as HTMLElement | null;
    const container = containerRef.current;

    const focusables = container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusables?.[0] ?? container)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !container) return;

      const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
