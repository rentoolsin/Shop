import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export function Login() {
  const { status, signInWithPassword } = useAuth();
  const location = useLocation();
  const notAdmin = (location.state as { notAdmin?: boolean } | null)?.notAdmin;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "signed-in-admin") {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signInWithPassword(email, password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-50 px-4 dark:bg-graphite-950">
      <div className="w-full max-w-sm rounded-lg border border-graphite-200 bg-white p-6 dark:border-graphite-800 dark:bg-graphite-900">
        <h1 className="font-display text-[18px] font-bold text-ink dark:text-ink-inverted">
          RenTools Admin
        </h1>
        <p className="mt-1 font-body text-[13px] text-graphite-500">
          Sign in to manage rentals, inventory, and enquiries.
        </p>

        {notAdmin && (
          <p className="mt-3 rounded bg-state-danger/10 px-3 py-2 font-body text-[13px] text-state-danger">
            That account isn't set up for admin access.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="font-body text-[13px] text-state-danger">{error}</p>
          )}
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
