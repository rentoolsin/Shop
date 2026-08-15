import { ArrowUpRight, CircleNotch, MapPin, NavigationArrow } from "@phosphor-icons/react";
import { useState } from "react";
import { formatDistance, getDirectionsUrl, getDistanceFromUser, GeoError } from "../../utils/geo";

interface ShopLocationCardProps {
  /** Address text to display — callers pass whichever copy they already show (CMS or site settings). */
  address: string;
  latitude: number;
  longitude: number;
  className?: string;
}

type DistanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; km: number }
  | { status: "error"; message: string };

const GEO_ERROR_MESSAGES: Record<GeoError["reason"], string> = {
  unsupported: "Distance check isn't supported on this device.",
  denied: "Location access was denied — enable it to check the distance.",
  unavailable: "Couldn't get your location. Try again.",
};

/**
 * Tap-to-check-distance card for the shop's real location (see
 * `utils/geo.ts` and `site_settings.latitude/longitude`). Distinct from
 * `LocationBar`, which is the unrelated delivery-city picker at the top
 * of the homepage.
 *
 * Tapping the card asks the browser for the customer's position and
 * shows how far the shop is; the separate "Directions" link always opens
 * Google Maps regardless of whether the distance check succeeds.
 */
export function ShopLocationCard({ address, latitude, longitude, className = "" }: ShopLocationCardProps) {
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
    <div
      className={[
        "rounded border border-graphite-200 bg-white dark:border-graphite-800 dark:bg-graphite-900",
        className,
      ].join(" ")}
    >
      <button
        type="button"
        onClick={handleCheckDistance}
        aria-label="Check how far the shop is from you"
        className="flex w-full items-start gap-3 p-4 text-left transition-colors duration-150 ease-app active:bg-graphite-50 dark:active:bg-graphite-800"
      >
        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-500">
          <MapPin className="h-[18px] w-[18px] text-graphite-950" weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-body text-[14px] text-ink dark:text-ink-inverted">{address}</p>

          {distance.status === "idle" && (
            <p className="mt-1 font-body text-[12px] text-graphite-500">Tap to check distance from you</p>
          )}
          {distance.status === "loading" && (
            <p className="mt-1 inline-flex items-center gap-1.5 font-body text-[12px] text-graphite-500">
              <CircleNotch className="h-3 w-3 animate-spin" weight="regular" />
              Checking distance…
            </p>
          )}
          {distance.status === "success" && (
            <p className="mt-1 inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-accent-600 dark:text-accent-400">
              <NavigationArrow className="h-3.5 w-3.5" weight="regular" />
              {formatDistance(distance.km)} from you
            </p>
          )}
          {distance.status === "error" && (
            <p className="mt-1 font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">
              {distance.message}
            </p>
          )}
        </div>
      </button>

      <a
        href={getDirectionsUrl(latitude, longitude)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 border-t border-graphite-200 py-2.5 font-body text-[12.5px] font-medium text-graphite-600 transition-colors duration-150 ease-app active:bg-graphite-50 dark:border-graphite-800 dark:text-graphite-300 dark:active:bg-graphite-800"
      >
        Get directions
        <ArrowUpRight className="h-3.5 w-3.5" weight="regular" />
      </a>
    </div>
  );
}
