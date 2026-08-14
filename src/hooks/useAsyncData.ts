import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: unknown };

interface UseAsyncDataOptions {
  /**
   * Postgres tables to watch for live changes. Any insert/update/delete on
   * these tables — from the admin app, the customer app, another tab, or
   * another device — triggers a background refetch here, so admin edits
   * show up on customer screens instantly and vice versa.
   *
   * Requires Realtime to be enabled for the table (see
   * supabase/migrations/0011_enable_realtime.sql) and RLS to allow the
   * current role to SELECT the row.
   */
  realtimeTables?: string[];
}

/**
 * Wraps any async fetcher with a consistent loading/success/error shape and
 * a `refetch` handle. Every list/detail screen should build on this instead
 * of hand-rolling its own useState/useEffect fetch logic.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: UseAsyncDataOptions = {},
) {
  const { realtimeTables } = options;
  const [state, setState] = useState<AsyncState<T>>({
    status: "loading",
    data: null,
    error: null,
  });

  // Always call the latest fetcher (captures latest closure — e.g. current
  // search query) without needing it in every callback's dep array.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    let cancelled = false;
    setState({ status: "loading", data: null, error: null });

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ status: "success", data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", data: null, error });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Background refetch used for realtime updates — keeps the current data
  // on screen (no loading skeleton flash) and swaps in the fresh result
  // once it resolves, so a change made elsewhere doesn't interrupt whatever
  // the person is doing. Failures are swallowed: better to keep showing the
  // last good data than surface a transient error from a background sync.
  const silentRefetch = useCallback(() => {
    fetcherRef
      .current()
      .then((data) => setState({ status: "success", data, error: null }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  const tablesKey = realtimeTables && realtimeTables.length > 0 ? realtimeTables.join(",") : "";

  useEffect(() => {
    if (!tablesKey) return;

    const tables = tablesKey.split(",");
    const channel = supabase.channel(`live:${tablesKey}:${Math.random().toString(36).slice(2)}`);

    // Debounce so a burst of changes (e.g. saving a product with several
    // variants) triggers one refetch instead of one per row event.
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(silentRefetch, 250);
    };

    for (const table of tables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefetch);
    }
    channel.subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablesKey, silentRefetch]);

  return { ...state, refetch: run };
}
