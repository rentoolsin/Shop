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
  const [stage, setStage] = useState<"in" | "out">("in");

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setStage("out");
    }
  }, [location, displayLocation.pathname]);

  const handleAnimationEnd = () => {
    if (stage === "out") {
      setDisplayLocation(location);
      setStage("in");
    }
  };

  return (
    <div
      key={displayLocation.pathname}
      onAnimationEnd={handleAnimationEnd}
      className={[stage === "out" ? "animate-page-out" : "animate-page-in", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children(displayLocation)}
    </div>
  );
}
