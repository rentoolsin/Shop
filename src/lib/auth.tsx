import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthStatus = "loading" | "signed-out" | "signed-in-not-admin" | "signed-in-admin";

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  // RLS on admin_users only allows admins to read it, so a non-admin
  // signed-in user gets `error` (permission denied) here, not a clean
  // empty result — both cases mean "not an admin".
  if (error) return false;
  return !!data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setIsAdmin(null); // re-check on any auth change
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    checkIsAdmin(session.user.id).then((result) => {
      if (!cancelled) setIsAdmin(result);
    });
    return () => {
      cancelled = true;
    };
    // Intentionally depends on the id, not the whole `session.user` object:
    // Supabase issues a new session object on token refresh even when the
    // signed-in user hasn't changed, and re-running the admin check on every
    // refresh would be wasted work for no behavior change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const status: AuthStatus = initializing || (session?.user && isAdmin === null)
    ? "loading"
    : !session?.user
      ? "signed-out"
      : isAdmin
        ? "signed-in-admin"
        : "signed-in-not-admin";

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      signInWithPassword: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [status, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
