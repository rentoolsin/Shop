import { IndianRupee, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

interface TrustItem {
  icon: ReactNode;
  title: string;
  body: string;
}

const iconProps = { className: "h-[18px] w-[18px] text-white", strokeWidth: 1.8 } as const;

const DEFAULT_ITEMS: TrustItem[] = [
  { icon: <ShieldCheck {...iconProps} />, title: "Checked Equipment", body: "Quality checked before every rental" },
  { icon: <IndianRupee {...iconProps} />, title: "Transparent Pricing", body: "No hidden charges, what you see is what you pay" },
  { icon: <Phone {...iconProps} />, title: "Direct Support", body: "Call or WhatsApp, we're here to help" },
  { icon: <MapPin {...iconProps} />, title: "Local Availability", body: "Quick delivery or pickup from nearby" },
];

interface TrustBarProps {
  items?: TrustItem[];
}

/**
 * Feature/trust grid — sits directly on the page surface (no card frame),
 * two columns of icon + title + body, matching the tool-yard reassurance
 * strip from the reference design.
 */
export function TrustBar({ items = DEFAULT_ITEMS }: TrustBarProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5">
      {items.map((item) => (
        <div key={item.title} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-500">
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="font-display text-[13.5px] font-bold leading-tight text-ink dark:text-ink-inverted">
              {item.title}
            </p>
            <p className="mt-0.5 font-body text-[12px] leading-snug text-graphite-500">
              {item.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
