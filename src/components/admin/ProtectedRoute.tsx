import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../lib/auth";
import { LoadingState } from "../ui/LoadingState";

export function ProtectedRoute({ children }: { children: ReactNode }) {
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

  return <>{children}</>;
}
