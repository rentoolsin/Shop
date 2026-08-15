import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "rentools:cart";
// Same cross-component-sync approach as useSavedProducts.ts — the native
// `storage` event only fires in other tabs, so a custom event carries
// same-tab updates (Products page badge, ProductDetail, the Cart page).
const SYNC_EVENT = "rentools:cart-changed";

export interface CartItem {
  productId: string;
  productName: string;
  /** Selected variant, if the product has variants — shown as a spec tag. */
  variantLabel?: string;
  /** Snapshot at the time it was added — a later price change on the
   *  product shouldn't silently change what's already in the cart. */
  dailyRate: number | null;
  /** Admin-set "was" rate snapshot, same convention as ProductCard/ProductDetail — shown struck through with a "Save ₹X/day" badge. Null = no discount. */
  originalDailyRate?: number | null;
  quantity: number;
}

function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is CartItem =>
        v && typeof v.productId === "string" && typeof v.productName === "string" && typeof v.quantity === "number",
    );
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can be unavailable (private browsing, quota) — the cart is a
    // convenience, not worth surfacing an error for.
  }
}

/** Shared multi-item cart state, persisted to localStorage (no account system exists to attach this to server-side, same as useSavedProducts). */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => readCart());
  // Tracks whether the current `items` came from this hook instance's own
  // update (needs to persist + broadcast) vs. a sync from another instance
  // (already persisted, just adopt the state).
  const isLocalUpdate = useRef(false);

  useEffect(() => {
    const sync = () => {
      isLocalUpdate.current = false;
      setItems(readCart());
    };
    window.addEventListener("storage", sync);
    window.addEventListener(SYNC_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SYNC_EVENT, sync);
    };
  }, []);

  // Persisting and broadcasting here — after render/commit — rather than
  // inside the setState updater avoids the "Cannot update a component while
  // rendering a different component" class of warning.
  useEffect(() => {
    if (!isLocalUpdate.current) return;
    isLocalUpdate.current = false;
    writeCart(items);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  }, [items]);

  const getQuantity = useCallback(
    (productId: string) => items.find((i) => i.productId === productId)?.quantity ?? 0,
    [items],
  );

  /** Adds a new line, or increases quantity if the product is already in the cart. */
  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    isLocalUpdate.current = true;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      return existing
        ? prev.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
          )
        : [...prev, { ...item, quantity }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    isLocalUpdate.current = true;
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    isLocalUpdate.current = true;
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    isLocalUpdate.current = true;
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, totalItems, getQuantity, addItem, setQuantity, removeItem, clearCart };
}
