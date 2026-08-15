import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "rentools:saved-products";
// Same-tab components (ProductDetail's heart, the Saved page, any future
// product card) need to react to each other's writes immediately — the
// native `storage` event only fires in *other* tabs, so a custom event
// carries the update within this tab too.
const SYNC_EVENT = "rentools:saved-products-changed";

function readSaved(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeSaved(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // Storage can be unavailable (private browsing, quota) — saved tools
    // are a convenience, not worth surfacing an error for.
  }
}

/** Shared saved/wishlist state, persisted to localStorage (no account system exists to attach this to server-side). */
export function useSavedProducts() {
  const [ids, setIds] = useState<string[]>(() => readSaved());

  useEffect(() => {
    const sync = () => setIds(readSaved());
    window.addEventListener("storage", sync);
    window.addEventListener(SYNC_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SYNC_EVENT, sync);
    };
  }, []);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      writeSaved(next);
      return next;
    });
  }, []);

  return { ids, isSaved, toggle };
}
