import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

export function NotFound() {
  // A client-rendered SPA can't return a real HTTP 404 status here — the
  // server always responds 200 for the SPA fallback (see vercel.json) — so
  // noindex is what keeps this route out of the index in its place.
  useDocumentMeta({ title: "Page not found", noindex: true });

  return (
    <div className="pt-6">
      {/* This route skips PageHeader (no back/title bar makes sense for a
          dead end), so EmptyState's h3 below would otherwise be the only
          heading on the page — every page needs one real h1 landmark. */}
      <h1 className="sr-only">Page not found</h1>
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist."
        action={
          <Link to="/">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        }
      />
    </div>
  );
}
