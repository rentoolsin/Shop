import { Minus, Plus } from "@phosphor-icons/react";
import type { MouseEvent } from "react";

interface QuantityStepperProps {
  quantity: number;
  onDecrease: (e: MouseEvent<HTMLButtonElement>) => void;
  onIncrease: (e: MouseEvent<HTMLButtonElement>) => void;
  size?: "xs" | "sm" | "md";
  className?: string;
  decreaseLabel?: string;
  increaseLabel?: string;
}

const SIZE_CLASSES = {
  xs: { btn: "h-7 w-7", icon: "h-2.5 w-2.5", text: "min-w-[13px] text-[11.5px]", gap: "gap-0.5" },
  sm: { btn: "h-8 w-8", icon: "h-3 w-3", text: "min-w-[18px] text-[12.5px]", gap: "gap-2.5" },
  md: { btn: "h-10 w-10", icon: "h-3.5 w-3.5", text: "min-w-[20px] text-[14px]", gap: "gap-2.5" },
} as const;

/**
 * Quantity +/- control: two separate bordered square buttons with the
 * count sitting free between them (in place of the old single pill with
 * both buttons fused inside one rounded-full border). Shared by
 * ProductCard, ProductDetail and Cart so the control looks and behaves
 * identically everywhere it appears.
 */
export function QuantityStepper({
  quantity,
  onDecrease,
  onIncrease,
  size = "md",
  className = "",
  decreaseLabel = "Decrease quantity",
  increaseLabel = "Increase quantity",
}: QuantityStepperProps) {
  const s = SIZE_CLASSES[size];
  const buttonClasses = [
    s.btn,
    "flex flex-shrink-0 items-center justify-center rounded border border-graphite-200 bg-white text-ink",
    "transition-all duration-150 ease-app active:scale-90 active:bg-graphite-50",
    "dark:border-graphite-700 dark:bg-graphite-900 dark:text-ink-inverted dark:active:bg-graphite-800",
  ].join(" ");

  return (
    <div className={["flex flex-shrink-0 items-center", s.gap, className].join(" ")}>
      <button type="button" onClick={onDecrease} aria-label={decreaseLabel} className={buttonClasses}>
        <Minus className={s.icon} weight="bold" />
      </button>
      <span
        className={[
          "text-center font-body font-semibold text-ink dark:text-ink-inverted",
          s.text,
        ].join(" ")}
      >
        {quantity}
      </span>
      <button type="button" onClick={onIncrease} aria-label={increaseLabel} className={buttonClasses}>
        <Plus className={s.icon} weight="bold" />
      </button>
    </div>
  );
}
