import { useEffect, useRef, type RefObject } from "react";
import { useNavigate } from "react-router-dom";

// Minimum horizontal travel (px) before a touch counts as an intentional
// swipe rather than a tap or scroll wobble.
const SWIPE_THRESHOLD_PX = 70;
// Vertical travel must stay well under horizontal travel, or this is a
// vertical scroll, not a left/right swipe.
const MAX_VERTICAL_RATIO = 0.55;
// Slow, dragged-out gestures (e.g. a long-press-drag) don't count.
const MAX_DURATION_MS = 600;
// How far up the DOM from the touch target to look for a horizontally
// scrollable ancestor (hero carousel, image gallery, category chip strip)
// before giving up and treating the gesture as page navigation.
const SCROLLER_SEARCH_DEPTH = 8;

function startsInsideHorizontalScroller(target: EventTarget | null): boolean {
  let node = target instanceof Element ? target : null;
  let depth = 0;
  while (node && depth < SCROLLER_SEARCH_DEPTH) {
    if (node.scrollWidth > node.clientWidth + 1) {
      const overflowX = getComputedStyle(node).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return true;
    }
    node = node.parentElement;
    depth++;
  }
  return false;
}

function canGoBack(): boolean {
  const state = window.history.state as { idx?: number } | null;
  // BrowserRouter (and the browser itself) stamp an `idx` on history.state;
  // idx 0 means this is the first entry in the session — nothing to go
  // back to inside the app, so a right-swipe here should be a no-op
  // instead of exiting the PWA / falling back to whatever the browser
  // was showing before.
  return typeof state?.idx === "number" ? state.idx > 0 : true;
}

/**
 * Android/iOS-style swipe navigation: swipe right anywhere on the attached
 * element to go to the previous page, swipe left to go forward again (the
 * page you just came back from, if any) — the same back/forward gesture
 * users already expect. A gesture that starts inside something
 * horizontally scrollable (hero carousel, image gallery, category chip
 * strip) is left alone so it never fights that element's own scrolling.
 */
export function useSwipeNavigation(containerRef: RefObject<HTMLElement>) {
  const navigate = useNavigate();
  const start = useRef<{ x: number; y: number; time: number; ignore: boolean } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        start.current = null;
        return;
      }
      const t = e.touches[0];
      start.current = {
        x: t.clientX,
        y: t.clientY,
        time: Date.now(),
        ignore: startsInsideHorizontalScroller(e.target),
      };
    };

    const onTouchEnd = (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s || s.ignore) return;

      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      const dt = Date.now() - s.time;

      if (dt > MAX_DURATION_MS) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) return;

      if (dx > 0) {
        if (canGoBack()) navigate(-1);
      } else {
        navigate(1);
      }
    };

    const onTouchCancel = () => {
      start.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [containerRef, navigate]);
}
