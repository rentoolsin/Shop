import { useEffect, useState, type ReactNode } from "react";
import { useLocation, type Location } from "react-router-dom";

interface PageTransitionProps {
  /** Render-prop so the caller can pin its <Routes location={...}> to the
   *  location this wrapper is currently displaying (not necessarily the
   *  live router location — see below). */
  children: (location: Location) => ReactNode;
  className?: string;
}

/**
 * Smooth cross-fade + rise between route changes.
 *
 * React Router swaps matched elements instantly, which reads as a jump cut.
 * To avoid that without pulling in an animation library, this component
 * keeps the *previous* route mounted for one short "out" animation, then
 * swaps to the new route's "in" animation once that finishes — so every
 * navigation reads as one continuous motion instead of an abrupt cut.
 *
 * `prefers-reduced-motion` is respected globally (see index.css), which
 * collapses both animations to ~0ms.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  // "idle" is the resting state once an entrance animation has finished —
  // deliberately a *different* state from "in", not just "in" left
  // sitting there. `animate-page-in`/`animate-page-out` both end on a
  // `transform` keyframe, and `animation-fill-mode: both` (see
  // tailwind.config.js) holds that transform forever once the animation
  // completes — even though it's the identity transform
  // `translateY(0) scale(1)` and looks like a no-op. Per spec, *any*
  // non-"none" transform on an ancestor creates a new containing block
  // for `position: fixed` AND `position: sticky` descendants, scoping
  // them to this wrapper's box instead of the real viewport. That's what
  // broke the sticky category-chip row under the header, and is the
  // reason BottomSheet/Modal have to portal out to <body> instead of
  // just using z-index. Dropping the animation class entirely once it's
  // done (going to "idle", which has no className at all) removes the
  // transform for real, so sticky/fixed descendants work normally for
  // the rest of the time the page just sits there.
  const [stage, setStage] = useState<"in" | "out" | "idle">("in");

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setStage("out");
    }
  }, [location, displayLocation.pathname]);

  const handleAnimationEnd = () => {
    if (stage === "out") {
      setDisplayLocation(location);
      setStage("in");
    } else if (stage === "in") {
      setStage("idle");
    }
  };

  const stageClassName = stage === "out" ? "animate-page-out" : stage === "in" ? "animate-page-in" : "";

  return (
    <div
      key={displayLocation.pathname}
      onAnimationEnd={handleAnimationEnd}
      className={[stageClassName, className].filter(Boolean).join(" ")}
    >
      {children(displayLocation)}
    </div>
  );
}
