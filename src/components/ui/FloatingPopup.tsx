import { useCallback, useEffect, useLayoutEffect, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

interface FloatingPopupProps {
  /** The element the popup hangs off (usually the field's wrapper). */
  anchorRef: RefObject<HTMLElement>;
  /** Lets the owner treat clicks inside the popup as "inside" for outside-click handling. */
  popupRef: RefObject<HTMLDivElement>;
  children: ReactNode;
  className?: string;
  /** Make the popup exactly as wide as the anchor (dropdown-style). Otherwise it keeps its own width. */
  matchAnchorWidth?: boolean;
  /** Upper bound in px; the popup scrolls inside itself beyond this. */
  maxHeight?: number;
  role?: string;
  "aria-label"?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
}

const GAP = 4;
const MARGIN = 8;
const MIN_HEIGHT = 120;

/**
 * Popup for dropdown-style controls (Select, DatePicker, TimePicker).
 *
 * Rendered in a portal on <body> with `position: fixed`, positioned from the
 * anchor's on-screen rectangle. An `absolute` popup inside a Modal gets
 * clipped by the modal's own scroll area (`overflow-y-auto` / `overflow-hidden`)
 * — that is what cut the calendar off at the top of the Extend rental
 * dialog. A portalled popup can't be clipped by any ancestor.
 *
 * It opens below the field when there's room, flips above when there isn't
 * (and above has more room), stays inside the viewport horizontally, and
 * scrolls internally if neither side fits it. Position is re-applied on every
 * render and on scroll/resize, so it follows the field while a modal body
 * scrolls. z-[70] keeps it above Modal / BottomSheet (z-50) and nav bars.
 *
 * Positioning writes styles straight to the element (no React state), so
 * re-measuring never causes an extra render.
 */
export function FloatingPopup({
  anchorRef,
  popupRef,
  children,
  className = "",
  matchAnchorWidth = false,
  maxHeight,
  role,
  "aria-label": ariaLabel,
  onKeyDown,
}: FloatingPopupProps) {
  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const pop = popupRef.current;
    if (!anchor || !pop) return;

    const rect = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Measure the popup at its natural size before constraining it.
    pop.style.maxHeight = "";
    if (matchAnchorWidth) pop.style.width = `${rect.width}px`;
    const naturalHeight = pop.offsetHeight;
    const width = pop.offsetWidth;

    const spaceBelow = vh - rect.bottom - GAP - MARGIN;
    const spaceAbove = rect.top - GAP - MARGIN;
    const openUp = naturalHeight > spaceBelow && spaceAbove > spaceBelow;

    let available = Math.max(MIN_HEIGHT, openUp ? spaceAbove : spaceBelow);
    if (maxHeight !== undefined) available = Math.min(available, maxHeight);
    const height = Math.min(naturalHeight, available);

    const top = openUp ? rect.top - GAP - height : rect.bottom + GAP;
    let left = matchAnchorWidth ? rect.left : Math.min(rect.left, vw - MARGIN - width);
    left = Math.max(MARGIN, left);

    pop.style.maxHeight = `${Math.round(available)}px`;
    pop.style.overflowY = "auto";
    pop.style.top = `${Math.round(top)}px`;
    pop.style.left = `${Math.round(left)}px`;
    pop.style.visibility = "visible";
  }, [anchorRef, popupRef, matchAnchorWidth, maxHeight]);

  // Before paint, and again after any re-render (e.g. calendar month change
  // alters the height), so there's never a frame in the wrong place.
  useLayoutEffect(() => {
    place();
  });

  useEffect(() => {
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [place]);

  return createPortal(
    <div
      ref={popupRef}
      role={role}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={className}
      // Hidden until first placement so it never flashes at 0,0.
      style={{ position: "fixed", top: 0, left: 0, zIndex: 70, visibility: "hidden" }}
    >
      {children}
    </div>,
    document.body,
  );
}
