import { ArrowUpRight, Clock, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

interface MethodCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
  tone?: "default" | "accent";
}

function MethodCard({ icon, label, value, href, external, tone = "default" }: MethodCardProps) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={[
        "group relative flex flex-col justify-between overflow-hidden rounded border p-4",
        "transition-all duration-200 ease-app active:scale-[0.97]",
        tone === "accent"
          ? "border-transparent bg-gradient-to-br from-accent-500 to-accent-600 text-graphite-950"
          : "border-graphite-200 bg-white hover:border-graphite-300 dark:border-graphite-800 dark:bg-graphite-900 dark:hover:border-graphite-700",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <span
          className={[
            "flex h-10 w-10 items-center justify-center rounded-full",
            tone === "accent"
              ? "bg-graphite-950/10"
              : "bg-graphite-100 text-graphite-600 dark:bg-graphite-800 dark:text-graphite-300",
          ].join(" ")}
        >
          {icon}
        </span>
        <ArrowUpRight
          className={[
            "h-4 w-4 flex-shrink-0 transition-transform duration-200 ease-app group-active:translate-x-0.5 group-active:-translate-y-0.5",
            tone === "accent" ? "text-graphite-950/60" : "text-graphite-400",
          ].join(" ")}
          strokeWidth={1.8}
        />
      </div>
      <div className="mt-4">
        <p
          className={[
            "font-body text-[11.5px] font-medium uppercase tracking-[0.04em]",
            tone === "accent" ? "text-graphite-950/70" : "text-graphite-400",
          ].join(" ")}
        >
          {label}
        </p>
        <p
          className={[
            "mt-0.5 truncate font-display text-[14.5px] font-semibold",
            tone === "accent" ? "text-graphite-950" : "text-ink dark:text-ink-inverted",
          ].join(" ")}
        >
          {value}
        </p>
      </div>
    </a>
  );
}

export function Contact() {
  useDocumentMeta({
    title: "Contact",
    description:
      "Call, WhatsApp, or email RenTools, and find our tool and equipment rental location in Coimbatore.",
  });

  const settings = useSiteSettings();
  // Best-effort like homepage CMS content: render defaults while loading
  // or on error rather than blocking or showing an error state for what
  // is, functionally, static contact info.
  const { phone, whatsapp, email, address } =
    settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "RenTools, " + address,
  )}`;
  const waHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    "Hi RenTools, I'd like to ask about a tool rental.",
  )}`;

  return (
    <div>
      <PageHeader title="Contact" />

      <div className="space-y-5 p-4">
        {/* Hero */}
        <section className="relative overflow-hidden rounded bg-gradient-to-br from-graphite-950 to-graphite-800 px-5 py-7 dark:to-black">
          {/* Decorative glow */}
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
              Call, message, or drop by our Coimbatore yard — whichever&apos;s easiest for you.
            </p>
            <div className="mt-5 flex gap-2">
              <a
                href={`tel:${phone}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-white/15 bg-white/10 px-4 py-3 font-body text-[13.5px] font-semibold text-white backdrop-blur-sm transition-all active:scale-95"
              >
                <Phone className="h-4 w-4" strokeWidth={1.8} />
                Call
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-accent-500 px-4 py-3 font-body text-[13.5px] font-semibold text-graphite-950 shadow-[0_4px_14px_-2px_rgba(240,168,27,0.5)] transition-all active:scale-95"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Method cards */}
        <section className="grid grid-cols-2 gap-3">
          <MethodCard
            icon={<Phone className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            label="Call"
            value={phone}
            href={`tel:${phone}`}
          />
          <MethodCard
            icon={<MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            label="WhatsApp"
            value="Message us"
            href={waHref}
            external
            tone="accent"
          />
          <MethodCard
            icon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            label="Email"
            value={email}
            href={`mailto:${email}`}
          />
          <MethodCard
            icon={<MapPin className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            label="Visit"
            value="Get directions"
            href={mapsUrl}
            external
          />
        </section>

        {/* Visit us / map */}
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
                backgroundImage:
                  "radial-gradient(currentColor 1px, transparent 1px)",
                backgroundSize: "16px 16px",
                color: "rgb(113 113 106)",
              }}
            />
            <div className="absolute left-6 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-accent-500/30" />
            <div className="absolute left-6 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border border-accent-500/50" />
            <div className="absolute left-6 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-500 shadow-[0_4px_12px_-2px_rgba(240,168,27,0.6)]">
              <MapPin className="h-4 w-4 text-graphite-950" strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
            </div>
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-graphite-950/80 px-2.5 py-1 font-body text-[11px] font-medium text-white backdrop-blur-sm">
              Open in Maps
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            </span>
          </a>
          <div className="p-4">
            <h2 className="font-display text-[14px] font-semibold text-ink dark:text-ink-inverted">
              RenTools yard
            </h2>
            <p className="mt-1 font-body text-[13.5px] leading-relaxed text-graphite-500">{address}</p>
          </div>
        </section>

        {/* Reassurance strip */}
        <section className="grid grid-cols-2 gap-2 rounded border border-graphite-200 bg-graphite-50 px-4 py-3.5 dark:border-graphite-800 dark:bg-graphite-900/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-graphite-400" strokeWidth={1.8} />
            <span className="font-body text-[11.5px] text-graphite-500">Local, Coimbatore-based</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0 text-graphite-400" strokeWidth={1.8} />
            <span className="font-body text-[11.5px] text-graphite-500">Fast replies on WhatsApp</span>
          </div>
        </section>
      </div>
    </div>
  );
}
