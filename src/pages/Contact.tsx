import { ArrowUpRight, Clock, Loader2, Mail, MapPin, MessageCircle, Navigation, Phone, ShieldCheck, Wrench } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";
import { formatDistance, getDirectionsUrl, getDistanceFromUser, GeoError } from "../utils/geo";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

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

/** A single reach-us row — kept distinct from the hero's WhatsApp/Call CTAs and the Visit card below, so no method appears twice. */
function ReachRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 ease-app active:bg-graphite-50 dark:active:bg-graphite-800"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-body text-[11.5px] font-medium uppercase tracking-[0.04em] text-graphite-400">
          {label}
        </p>
        <p className="truncate font-display text-[14.5px] font-semibold text-ink dark:text-ink-inverted">
          {value}
        </p>
      </div>
      <ArrowUpRight
        className="h-4 w-4 flex-shrink-0 text-graphite-300 transition-transform duration-200 ease-app group-active:translate-x-0.5 group-active:-translate-y-0.5 dark:text-graphite-600"
        strokeWidth={1.8}
      />
    </a>
  );
}

export function Contact() {
  useDocumentMeta({
    title: "Contact",
    description:
      "Call, WhatsApp, or email RenTools, and find our tool and equipment rental location in Coimbatore.",
  });

  const navigate = useNavigate();
  const settings = useSiteSettings();
  // Best-effort like homepage CMS content: render defaults while loading
  // or on error rather than blocking or showing an error state for what
  // is, functionally, static contact info.
  const { phone, whatsapp, email, address, latitude, longitude } =
    settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;
  const mapsUrl = getDirectionsUrl(latitude, longitude);
  const waHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    "Hi RenTools, I'd like to ask about a tool rental.",
  )}`;

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
    <div>
      <PageHeader title="Contact" />

      <div className="space-y-5 p-4">
        {/* Hero — the one place WhatsApp/Call live as buttons */}
        <section className="relative overflow-hidden rounded bg-gradient-to-br from-graphite-950 to-graphite-800 px-5 py-7 dark:to-black">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-body text-[11px] font-medium text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-state-success" />
              Usually replies in minutes
            </span>
            <h1 className="mt-3 font-display text-[22px] font-semibold leading-tight text-white">
              Let&apos;s get you the right tool
            </h1>
            <p className="mt-1.5 max-w-[32ch] font-body text-[13.5px] leading-relaxed text-graphite-400">
              Message us on WhatsApp for the fastest reply, or call — whichever&apos;s easiest for you.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="accent"
                fullWidth
                className="!h-auto py-3"
                onClick={() => window.open(waHref, "_blank", "noopener,noreferrer")}
              >
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
                  WhatsApp
                </span>
              </Button>
              <a
                href={`tel:${phone}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-white/15 bg-white/10 px-4 py-3 font-body text-[13.5px] font-semibold text-white backdrop-blur-sm transition-all active:scale-95"
              >
                <Phone className="h-4 w-4" strokeWidth={1.8} />
                Call
              </a>
            </div>
          </div>
        </section>

        {/* Reach us — phone/email only; WhatsApp is already the hero's primary CTA */}
        <section className="divide-y divide-graphite-100 overflow-hidden rounded border border-graphite-200 bg-white dark:divide-graphite-800 dark:border-graphite-800 dark:bg-graphite-900">
          <ReachRow icon={<Phone className="h-[18px] w-[18px]" strokeWidth={1.8} />} label="Call" value={phone} href={`tel:${phone}`} />
          <ReachRow icon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.8} />} label="Email" value={email} href={`mailto:${email}`} />
        </section>

        {/* Visit — map, address, distance check and directions live here once, nowhere else */}
        <section className="overflow-hidden rounded border border-graphite-200 bg-white dark:border-graphite-800 dark:bg-graphite-900">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block h-32 overflow-hidden bg-graphite-100 dark:bg-graphite-800"
          >
            {/* Abstract map treatment — a stylised location preview rather
                than a real map tile (no map API wired up), consistent with
                the app's flat graphite/accent design language. */}
            <div
              className="absolute inset-0 opacity-[0.35] dark:opacity-[0.25]"
              style={{
                backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                backgroundSize: "16px 16px",
                color: "rgb(113 113 106)",
              }}
            />
            <div className="absolute left-6 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-accent-500/30" />
            <div className="absolute left-6 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border border-accent-500/50" />
            <div className="absolute left-6 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-500 shadow-[0_4px_12px_-2px_rgba(240,168,27,0.6)]">
              <MapPin className="h-4 w-4 text-graphite-950" strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
            </div>
          </a>

          <div className="p-4">
            <h2 className="font-display text-[14px] font-semibold text-ink dark:text-ink-inverted">
              RenTools yard
            </h2>
            <p className="mt-0.5 font-body text-[13px] leading-relaxed text-graphite-500">{address}</p>

            {distance.status === "success" && (
              <p className="mt-2 inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-accent-600 dark:text-accent-400">
                <Navigation className="h-3.5 w-3.5" strokeWidth={2} />
                {formatDistance(distance.km)} from you
              </p>
            )}
            {distance.status === "error" && (
              <p className="mt-2 font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">
                {distance.message}
              </p>
            )}

            <div className="mt-3.5 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={handleCheckDistance}
                disabled={distance.status === "loading"}
              >
                <span className="inline-flex items-center gap-1.5">
                  {distance.status === "loading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <Navigation className="h-3.5 w-3.5" strokeWidth={1.8} />
                  )}
                  Check distance
                </span>
              </Button>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded bg-accent-500 font-body text-[13px] font-semibold text-graphite-950 transition-all active:scale-[0.97]"
              >
                Directions
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </a>
            </div>
          </div>
        </section>

        {/* Reassurance strip — accent-toned to match theme, distinct info from the rest of the page */}
        <section className="grid grid-cols-2 gap-2 rounded border border-graphite-200 bg-graphite-50 px-4 py-3.5 dark:border-graphite-800 dark:bg-graphite-900/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-accent-500" strokeWidth={1.8} />
            <span className="font-body text-[11.5px] text-graphite-500">Local, Coimbatore-based</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0 text-accent-500" strokeWidth={1.8} />
            <span className="font-body text-[11.5px] text-graphite-500">Fast replies on WhatsApp</span>
          </div>
        </section>

        {/* Soft handoff back into the funnel — not shown anywhere else on this page */}
        <section className="flex items-center gap-3 rounded border border-dashed border-graphite-300 bg-white px-4 py-3.5 dark:border-graphite-700 dark:bg-graphite-900">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-graphite-100 text-graphite-500 dark:bg-graphite-800 dark:text-graphite-300">
            <Wrench className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-body text-[13px] font-medium text-ink dark:text-ink-inverted">
              Not sure what to ask for?
            </p>
            <p className="font-body text-[12px] text-graphite-500">Browse the catalog first, then reach out.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/products")}>
            Browse
          </Button>
        </section>
      </div>
    </div>
  );
}
