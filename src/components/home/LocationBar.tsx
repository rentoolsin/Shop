import { ChevronDown, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocations } from "../../hooks/useLocations";
import type { LocationListItem } from "../../services/locations.service";
import { BottomSheet } from "../ui/BottomSheet";
import { useToast } from "../ui/Toast";

const STORAGE_KEY = "rentools-selected-location";

/**
 * Delivery-location strip shown at the top of the homepage hero. Backed by
 * the admin-managed `locations` table (see src/pages/admin/locations) —
 * tapping it opens a picker of every location admin has added; picking an
 * available one updates the strip, picking one that isn't yet shows a
 * "coming soon" toast instead of switching to it.
 */
export function LocationBar() {
  const locations = useLocations();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  const list = locations.status === "success" ? locations.data : [];
  const selected =
    list.find((l) => l.id === selectedId && l.isAvailable) ?? list.find((l) => l.isAvailable) ?? null;

  // If the previously-selected location was removed or deactivated by
  // admin, drop it from storage so we don't keep pointing at a dead id.
  useEffect(() => {
    if (locations.status !== "success") return;
    if (selectedId && !list.some((l) => l.id === selectedId && l.isAvailable)) {
      window.localStorage.removeItem(STORAGE_KEY);
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations.status]);

  const handleSelect = (location: LocationListItem) => {
    if (!location.isAvailable) {
      showToast(`${location.name} is coming soon — we don't deliver there yet.`, "default");
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, location.id);
    setSelectedId(location.id);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded border border-graphite-200 bg-white px-3.5 py-2.5 text-left shadow-card transition-colors duration-150 ease-app active:bg-graphite-50 dark:border-graphite-800 dark:bg-graphite-900/80 dark:active:bg-graphite-800"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-accent-500">
          <MapPin className="h-6 w-6" strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[13.5px] font-semibold text-ink dark:text-ink-inverted">
            {selected ? `${selected.name}, ${selected.state}` : "Coimbatore, Tamil Nadu"}
          </p>
          <p className="truncate font-body text-[11.5px] text-graphite-500">Delivering to your site</p>
        </div>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-graphite-400" strokeWidth={2} />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Choose your location">
        <div className="flex flex-col gap-1">
          {locations.status === "loading" && (
            <p className="py-4 text-center font-body text-[13px] text-graphite-500">Loading locations…</p>
          )}
          {locations.status === "error" && (
            <p className="py-4 text-center font-body text-[13px] text-graphite-500">
              Couldn't load locations. Try again shortly.
            </p>
          )}
          {locations.status === "success" &&
            list.map((location) => {
              const isSelected = selected?.id === location.id;
              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className={[
                    "flex items-center justify-between gap-3 rounded px-3 py-3 text-left transition-colors duration-150 ease-app",
                    isSelected
                      ? "bg-accent-500/10"
                      : "active:bg-graphite-50 dark:active:bg-graphite-800",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="truncate font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                      {location.name}
                    </p>
                    <p className="truncate font-body text-[12px] text-graphite-500">{location.state}</p>
                  </div>
                  {!location.isAvailable && (
                    <span className="flex-shrink-0 rounded-full bg-graphite-100 px-2.5 py-1 font-body text-[11px] font-medium text-graphite-500 dark:bg-graphite-800 dark:text-graphite-400">
                      Coming soon
                    </span>
                  )}
                  {location.isAvailable && isSelected && (
                    <span className="flex-shrink-0 font-body text-[11px] font-semibold text-accent-600 dark:text-accent-400">
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </BottomSheet>
    </>
  );
}
