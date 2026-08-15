import { MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminLocations } from "../../../hooks/useAdminData";
import { deleteLocation } from "../../../services/admin-locations.service";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";

function LocationIcon() {
  return <MapPin className="h-6 w-6" strokeWidth={1.5} />;
}

export function LocationsList() {
  const locations = useAdminLocations();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteLocation(pendingDelete.id);
      showToast("Location deleted.", "success");
      setPendingDelete(null);
      locations.refetch();
    } catch {
      showToast("Couldn't delete this location. Try again.", "danger");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          Locations
        </h1>
        <Link to="/admin/locations/new">
          <Button size="sm"><Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />New location</Button>
        </Link>
      </div>
      <p className="mb-4 font-body text-[13px] text-graphite-500">
        Shown in the customer app's location picker. Mark a location "Available" once you actually
        deliver there — others show a "Coming soon" message when a customer selects them.
      </p>

      {locations.status === "loading" && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {locations.status === "error" && (
        <ErrorState title="Couldn't load locations" onRetry={locations.refetch} />
      )}

      {locations.status === "success" && locations.data.length === 0 && (
        <EmptyState
          icon={<LocationIcon />}
          title="No locations yet"
          description="Add Coimbatore (or wherever you deliver first) to show it in the customer app."
          action={
            <Link to="/admin/locations/new">
              <Button size="sm"><Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />New location</Button>
            </Link>
          }
        />
      )}

      {locations.status === "success" && locations.data.length > 0 && (
        <div className="space-y-2">
          {locations.data.map((location) => (
            <Card key={location.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                  {location.name}
                </p>
                <p className="font-body text-[12px] text-graphite-400">{location.state}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={location.isAvailable ? "Available" : "Coming soon"}
                  tone={location.isAvailable ? "success" : "neutral"}
                />
                <Link to={`/admin/locations/${location.id}/edit`}>
                  <Button variant="ghost" size="sm">Edit</Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDelete({ id: location.id, name: location.name })}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete location?"
        description={pendingDelete ? `"${pendingDelete.name}" will be removed from the location picker.` : undefined}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
