import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";

export function Location() {
  const settings = useSiteSettings();
  const { address } = settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "RenTools, " + address,
  )}`;

  return (
    <div>
      <PageHeader title="Location" />
      <div className="space-y-4 p-4">
        <p className="font-body text-[14px] text-ink dark:text-ink-inverted">{address}</p>
        <Button
          fullWidth
          variant="secondary"
          onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
        >
          Open in Maps
        </Button>
      </div>
    </div>
  );
}
