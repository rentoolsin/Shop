import { IndianRupee, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

interface TrustItem {
  icon: ReactNode;
  title: string;
  body: string;
}

const iconProps = { className: "h-5 w-5 text-accent-400", strokeWidth: 1.6 } as const;

const DEFAULT_ITEMS: TrustItem[] = [
  { icon: <ShieldCheck {...iconProps} />, title: "Checked & Ready", body: "Tools checked before pickup" },
  { icon: <IndianRupee {...iconProps} />, title: "Affordable Pricing", body: "Straightforward daily rates" },
  { icon: <Phone {...iconProps} />, title: "Talk Directly", body: "Call or WhatsApp for quick help" },
  { icon: <MapPin {...iconProps} />, title: "Local Support", body: "Coimbatore based service" },
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
