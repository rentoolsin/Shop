import { useEffect } from "react";

/** Locks body scroll while `active` is true. Shared by Modal + BottomSheet
 * so overlay scroll-locking behavior is defined exactly once. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}
