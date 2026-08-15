import { ArrowUpRight, Clock, CircleNotch, Envelope, MapPin, NavigationArrow, Phone, ShieldCheck, Wrench } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";
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
        weight="regular"
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
          {/* Dot pattern, confined behind the headset illustration */}
          <div
            className="pointer-events-none absolute -right-4 -top-4 h-28 w-36 opacity-40"
            style={{
              backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "14px 14px",
              color: "rgb(240 168 27)",
              maskImage: "radial-gradient(ellipse at top right, black 40%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at top right, black 40%, transparent 75%)",
            }}
          />
          <div className="relative flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-body text-[11px] font-medium text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-state-success" />
                Usually replies in minutes
              </span>
              <h1 className="mt-3 font-display text-[22px] font-semibold leading-tight text-white">
                We&apos;re here to help you find the <span className="text-accent-400">right tool</span>.
              </h1>
              <p className="mt-1.5 font-body text-[13.5px] leading-relaxed text-graphite-400">
                Message us on WhatsApp for the fastest reply, or call — whichever&apos;s easiest for you.
              </p>
            </div>
            <img
              src="/images/support-headset.png"
              alt=""
              aria-hidden="true"
              className="h-16 w-auto flex-shrink-0 drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
            />
          </div>
          <div className="relative mt-5 flex gap-2">
            <div className="flex-1">
              <Button
                variant="accent"
                fullWidth
                className="!h-auto py-3"
                onClick={() => window.open(waHref, "_blank", "noopener,noreferrer")}
              >
                <span className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap">
                  <WhatsAppIcon className="h-4 w-4" />
                  Chat on WhatsApp
                </span>
              </Button>
            </div>
            <a
              href={`tel:${phone}`}
              className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded border border-white/15 bg-white/10 px-3.5 py-3 font-body text-[13.5px] font-semibold text-white backdrop-blur-sm transition-all active:scale-95"
            >
              <Phone className="h-4 w-4" weight="regular" />
              Call Us
            </a>
          </div>
        </section>

        {/* Reach us — phone/email only; WhatsApp is already the hero's primary CTA */}
        <section>
          <h2 className="mb-1.5 px-1 font-display text-[12.5px] font-semibold uppercase tracking-[0.04em] text-graphite-400">
            Reach us directly
          </h2>
          <div className="divide-y divide-graphite-100 overflow-hidden rounded border border-graphite-200 bg-white dark:divide-graphite-800 dark:border-graphite-800 dark:bg-graphite-900">
            <ReachRow icon={<Phone className="h-[18px] w-[18px]" weight="regular" />} label="Call" value={phone} href={`tel:${phone}`} />
            <ReachRow icon={<Envelope className="h-[18px] w-[18px]" weight="regular" />} label="Email" value={email} href={`mailto:${email}`} />
          </div>
        </section>

        {/* Visit — map, address, distance check and directions live here once, nowhere else */}
        <section>
          <h2 className="mb-1.5 px-1 font-display text-[12.5px] font-semibold uppercase tracking-[0.04em] text-graphite-400">
            Visit the yard
          </h2>
          <div className="overflow-hidden rounded border border-graphite-200 bg-white dark:border-graphite-800 dark:bg-graphite-900">
            <div className="relative h-40 overflow-hidden bg-graphite-100 dark:bg-graphite-800">
              {/* Real Google Maps embed, pinned to the shop's coordinates —
                  no API key required for this basic embed URL format. */}
              <iframe
                title="RenTools yard location"
                src={`https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 font-body text-[11px] font-semibold text-ink shadow-sm backdrop-blur-sm transition-all active:scale-95 dark:bg-graphite-950/90 dark:text-ink-inverted"
              >
                <MapPin className="h-3 w-3 text-accent-500" weight="fill" />
                Open in Maps
              </a>
            </div>

            <div className="p-4">
              <h3 className="font-display text-[14px] font-semibold text-ink dark:text-ink-inverted">
                RenTools yard
              </h3>
              <p className="mt-0.5 font-body text-[13px] leading-relaxed text-graphite-500">{address}</p>

              {distance.status === "success" && (
                <p className="mt-2 inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-accent-600 dark:text-accent-400">
                  <NavigationArrow className="h-3.5 w-3.5" weight="regular" />
                  {formatDistance(distance.km)} from you
                </p>
              )}
              {distance.status === "error" && (
                <p className="mt-2 font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">
                  {distance.message}
                </p>
              )}

              <div className="mt-3.5">
                <Button
                  variant="accent"
                  size="sm"
                  fullWidth
                  onClick={handleCheckDistance}
                  disabled={distance.status === "loading"}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {distance.status === "loading" ? (
                      <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="regular" />
                    ) : (
                      <NavigationArrow className="h-3.5 w-3.5" weight="regular" />
                    )}
                    Check distance
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Reassurance strip — accent-toned to match the "Pickup or delivery
            available" treatment on the product detail page */}
        <section className="grid grid-cols-2 gap-2 rounded border border-accent-200 bg-accent-50 px-3.5 py-3 dark:border-accent-700/40 dark:bg-accent-500/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-accent-600 dark:text-accent-400" weight="regular" />
            <span className="font-body text-[11.5px] leading-tight text-graphite-700 dark:text-graphite-300">Local, Coimbatore-based</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0 text-accent-600 dark:text-accent-400" weight="regular" />
            <span className="font-body text-[11.5px] leading-tight text-graphite-700 dark:text-graphite-300">Fast replies on WhatsApp</span>
          </div>
        </section>

        {/* Soft handoff back into the funnel — not shown anywhere else on this page */}
        <section className="rounded border border-dashed border-graphite-300 bg-white px-4 py-3.5 dark:border-graphite-700 dark:bg-graphite-900">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400">
              <Wrench className="h-[18px] w-[18px]" weight="regular" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-body text-[13px] font-medium text-ink dark:text-ink-inverted">
                Not sure what to ask for?
              </p>
              <p className="font-body text-[12px] text-graphite-500">Browse the catalog, or just tell us what you need.</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="accent" size="sm" fullWidth onClick={() => navigate("/products")}>
              Browse catalog
            </Button>
            <Button variant="outline" size="sm" fullWidth onClick={() => navigate("/enquire")}>
              Send a message
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
