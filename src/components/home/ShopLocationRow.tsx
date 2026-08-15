import { ArrowUpRight, CircleNotch, MapPin, NavigationArrow } from "@phosphor-icons/react";
import { useState } from "react";
import { formatDistance, getDirectionsUrl, getDistanceFromUser, GeoError } from "../../utils/geo";

interface ShopLocationRowProps {
  address: string;
  latitude: number;
  longitude: number;
}

type DistanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; km: number }
  | { status: "error"; message: string };

const GEO_ERROR_MESSAGES: Record<GeoError["reason"], string> = {
  unsupported: "Distance check isn't supported on this device.",
  denied: "Location access denied — enable it to check distance.",
  unavailable: "Couldn't get your location. Try again.",
};

/**
 * The shop's real, fixed location (site_settings.latitude/longitude —
 * see utils/geo.ts). Tapping the row checks how far it is from the
 * customer; the trailing arrow always opens Maps directions regardless.
 * The address truncates on one line, but the hint/result sits on its own
 * line below so it's never cut off by the truncation.
 */
export function ShopLocationRow({ address, latitude, longitude }: ShopLocationRowProps) {
  const [distance, setDistance] = useState<DistanceState>({ status: "idle" });

  const handleCheckDistance = () => {
    if (distance.status === "loading") return;
    setDistance({ status: "loading" });
    getDistanceFromUser(latitude, longitude)
      .then((km) => setDistance({ status: "success", km }))
      .catch((err: unknown) => {
        const message =
          err instanceof GeoError ? GEO_ERROR_MESSAGES[err.reason] : GEO_ERROR_MESSAGES.unavailable;
        setDistance({ status: "error", message });
      });
  };

  return (
    <div className="flex w-full items-start gap-3 px-3.5 py-2.5">
      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-500">
        <MapPin className="h-[18px] w-[18px] text-graphite-950" weight="fill" />
      </span>
      <button type="button" onClick={handleCheckDistance} className="min-w-0 flex-1 text-left">
        <p className="font-body text-[13.5px] font-semibold text-ink dark:text-ink-inverted">
          Shop location
        </p>
        <p className="mt-0.5 truncate font-body text-[11.5px] text-graphite-500">{address}</p>
        <p className="mt-1 flex items-center gap-1.5 font-body text-[11px] font-medium">
          {distance.status === "idle" && (
            <span className="text-graphite-500">Tap to check how far you are</span>
          )}
          {distance.status === "loading" && (
            <span className="inline-flex items-center gap-1.5 text-graphite-500">
              <CircleNotch className="h-3 w-3 animate-spin" weight="regular" />
              Checking distance…
            </span>
          )}
          {distance.status === "success" && (
            <span className="inline-flex items-center gap-1.5 text-accent-600 dark:text-accent-400">
              <NavigationArrow className="h-3 w-3" weight="regular" />
              {formatDistance(distance.km)} from you
            </span>
          )}
          {distance.status === "error" && (
            <span className="text-state-danger-text dark:text-state-danger-text-dark">
              {distance.message}
            </span>
          )}
        </p>
      </button>
      <a
        href={getDirectionsUrl(latitude, longitude)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get directions to the shop"
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-graphite-400 transition-colors active:bg-graphite-100 dark:active:bg-graphite-800"
      >
        <ArrowUpRight className="h-4 w-4" weight="regular" />
      </a>
    </div>
  );
}
