import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const positions = new Map<string, number>();

/**
 * On PUSH navigation: scroll to top of the new route.
 * On POP (back/forward): restore the scroll position captured when the
 * user left that route. Mount once near the router root.
 */
export function useScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();
  const key = location.pathname + location.search;
  const prevKey = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (prevKey.current) {
        positions.set(prevKey.current, window.scrollY);
      }
    };
  }, [key]);

  useEffect(() => {
    prevKey.current = key;
    if (navType === "POP" && positions.has(key)) {
      window.scrollTo(0, positions.get(key)!);
    } else {
      window.scrollTo(0, 0);
    }
  }, [key, navType]);
}
