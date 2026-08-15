import { ClipboardCheck, MessageSquare, Search, Truck, type LucideIcon } from "lucide-react";
import type { HowItWorksStep } from "../../utils/homepage-content";

// Fixed icon-per-position mapping (CMS only stores title/body text, not an
// icon choice) — falls back to the last icon if a step list somehow grows
// past four entries, rather than rendering nothing.
const STEP_ICONS: LucideIcon[] = [Search, MessageSquare, ClipboardCheck, Truck];

interface HowItWorksStepsProps {
  steps: HowItWorksStep[];
}

/**
 * Four-up "how it works" timeline: icon box, dashed connector, step number,
 * title and body — mirrors the tool-yard process strip from the reference
 * design. Wraps to 2-up on very narrow viewports rather than compressing
 * illegibly.
 */
export function HowItWorksSteps({ steps }: HowItWorksStepsProps) {
  return (
    <div className="grid grid-cols-4 gap-x-1.5 gap-y-6">
      {steps.map((step, index) => {
        const Icon = STEP_ICONS[index] ?? STEP_ICONS[STEP_ICONS.length - 1];
        const isLast = index === steps.length - 1;
        return (
          <div key={step.title} className="relative flex flex-col items-center text-center">
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute left-[calc(50%+26px)] right-[calc(-50%+26px)] top-6 border-t-2 border-dotted border-graphite-300 dark:border-graphite-700"
              />
            )}
            <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-graphite-100 shadow-card dark:bg-graphite-800/80">
              <Icon className="h-5 w-5 text-ink dark:text-ink-inverted" strokeWidth={1.8} />
            </span>
            <span className="mt-2 font-mono text-[12px] font-bold text-accent-500">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-1 font-body text-[12.5px] font-bold leading-tight text-ink dark:text-ink-inverted">
              {step.title}
            </p>
            <p className="mt-1 font-body text-[10.5px] leading-snug text-graphite-500">
              {step.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}
