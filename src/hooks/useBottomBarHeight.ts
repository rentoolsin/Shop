import { useLayoutEffect, useSyncExternalStore, type RefObject } from "react";

/**
 * The customer app's fixed bottom stack (install banner + nav) is one
 * element whose real height varies — the dock nav redesign changed it
 * once already, and the install banner changes it again any time it
 * shows or is dismissed. Toast and FloatingWhatsApp both need to sit
 * just above it.
 *
 * Rather than each of those hardcoding its own pixel guess for "how tall
 * is the bottom bar right now" — which is exactly how the nav redesign
 * silently broke Toast's and FloatingWhatsApp's clearance — the stack
 * reports its own real, live height here via ResizeObserver, and
 * everything else reads that single number. One measurement, no drift.
 */

let currentHeight = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentHeight;
}

function setHeight(next: number) {
  if (next === currentHeight) return;
  currentHeight = next;
  listeners.forEach((listener) => listener());
}

/** Call once, on the element that IS the fixed bottom stack, to publish its height. */
export function useReportBottomBarHeight(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setHeight(el.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      // Nothing is reporting a height anymore (route unmounted) — reset
      // so a stale value can't leak into a screen that has no bottom bar.
      setHeight(0);
    };
  }, [ref]);
}

/** Call anywhere else that needs to clear the bottom bar. Returns 0 until
 * the bar has reported its first measurement, so callers should keep a
 * sensible static fallback for that brief window / for routes with no
 * reporting bar. */
export function useBottomBarHeight(): number {
  return useSyncExternalStore(subscribe, getSnapshot);
}
