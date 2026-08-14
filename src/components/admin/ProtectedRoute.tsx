import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { LoadingState } from "../ui/LoadingState";

/**
 * Gates the *content* of admin routes, not the app chrome. Used as a
 * pathless layout route nested inside <AdminLayout>, so the sidebar
 * renders immediately and stays put — only the <Outlet /> area swaps
 * between "checking sign-in", a redirect, and the real page. This avoids
 * the whole screen (including the nav) blanking out and popping back in
 * while the session/admin-role check runs.
 */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <LoadingState label="Checking sign-in…" />;
  }

  if (status === "signed-out") {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (status === "signed-in-not-admin") {
    return <Navigate to="/admin/login" state={{ notAdmin: true }} replace />;
  }

  return <Outlet />;
}
