import { ChevronDown, MapPin } from "lucide-react";

/**
 * Static delivery-location strip shown at the top of the homepage hero.
 * Purely presentational (RenTools currently serves a single service area),
 * so this isn't wired to a location picker — it mirrors the physical
 * "delivering to your site" reassurance from the reference design.
 */
export function LocationBar() {
  return (
    <div className="flex items-center gap-3 rounded border border-graphite-200 bg-white px-3.5 py-2.5 shadow-card dark:border-graphite-800 dark:bg-graphite-900/80">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-accent-500">
        <MapPin className="h-6 w-6" strokeWidth={1.8} fill="currentColor" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-[13.5px] font-semibold text-ink dark:text-ink-inverted">
          Coimbatore, Tamil Nadu
        </p>
        <p className="truncate font-body text-[11.5px] text-graphite-500">
          Delivering to your site
        </p>
      </div>
      <ChevronDown className="h-4 w-4 flex-shrink-0 text-graphite-400" strokeWidth={2} />
    </div>
  );
}
