import type { ReactNode } from "react";

interface TrustItem {
  icon: ReactNode;
  title: string;
  body: string;
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-5 w-5 text-accent-400">
      <path
        d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RupeeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-5 w-5 text-accent-400">
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path d="M9 8h6M9 11h6M9 8c0 2.2-1.8 3-3 3h1l5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-5 w-5 text-accent-400">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1L6.6 10.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-5 w-5 text-accent-400">
      <path
        d="M12 21s-6.5-5.8-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.2-6.5 11-6.5 11Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" />
    </svg>
  );
}

const DEFAULT_ITEMS: TrustItem[] = [
  { icon: <ShieldCheckIcon />, title: "Checked & Ready", body: "Tools checked before pickup" },
  { icon: <RupeeIcon />, title: "Affordable Pricing", body: "Straightforward daily rates" },
  { icon: <PhoneIcon />, title: "Talk Directly", body: "Call or WhatsApp for quick help" },
  { icon: <PinIcon />, title: "Local Support", body: "Coimbatore based service" },
];

interface TrustBarProps {
  items?: TrustItem[];
}

/**
 * Dark feature strip anchoring the homepage hero — mirrors the physical
 * "checked & tagged" trust cues of the tool yard in a compact 2x2/4-up grid.
 */
export function TrustBar({ items = DEFAULT_ITEMS }: TrustBarProps) {
  return (
    <div className="rounded-2xl bg-graphite-950 px-4 py-5 dark:bg-black">
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-accent-500/40">
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="font-display text-[13px] font-semibold leading-tight text-white">
                {item.title}
              </p>
              <p className="mt-0.5 font-body text-[11.5px] leading-snug text-graphite-400">
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
