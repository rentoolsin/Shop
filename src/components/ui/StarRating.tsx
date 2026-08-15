import { Star } from "@phosphor-icons/react";
import { useState } from "react";

interface StarRatingDisplayProps {
  /** 0–5, fractional values (e.g. 4.3) render a partially-filled star. */
  value: number;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<StarRatingDisplayProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4.5 w-4.5",
};

/** Read-only star row — used for the summary and each review card. */
export function StarRatingDisplay({ value, size = "sm", className = "" }: StarRatingDisplayProps) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <span className={["inline-flex items-center gap-0.5", className].join(" ")} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => {
        // Fill percentage for this star: 0, 100, or a fraction for the one
        // star the rating falls inside (e.g. 4.3 → star index 4 is 30% filled).
        const fillPercent = Math.max(0, Math.min(1, clamped - i)) * 100;
        return (
          <span key={i} className="relative inline-block">
            <Star className={[SIZE_CLASS[size], "text-graphite-300 dark:text-graphite-700"].join(" ")} weight="regular" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <Star
                className={[SIZE_CLASS[size], "fill-accent-500 text-accent-500"].join(" ")}
                weight="regular"
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}

interface StarRatingPickerProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

/** Tappable 1–5 star picker for the "write a review" form. */
export function StarRatingPicker({ value, onChange, error }: StarRatingPickerProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value;

  return (
    <div>
      <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
        Your rating
      </span>
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHovered(null)}
        role="radiogroup"
        aria-label="Rating"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-150 ease-app active:scale-90"
          >
            <Star
              className={[
                "h-6 w-6",
                star <= shown ? "fill-accent-500 text-accent-500" : "text-graphite-300 dark:text-graphite-700",
              ].join(" ")}
              weight="regular"
            />
          </button>
        ))}
      </div>
      {error && (
        <span className="mt-1 block font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">
          {error}
        </span>
      )}
    </div>
  );
}
