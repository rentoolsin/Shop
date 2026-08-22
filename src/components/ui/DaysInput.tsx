import { CaretDown, Check } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

const DEFAULT_DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30];

interface DaysInputProps {
  value?: string;
  onChange: (value: string) => void;
  /** Accessible name for the underlying input — not shown visually (the caller renders its own "Days" text label). */
  label: string;
  required?: boolean;
  /** Shows the red "missing/invalid" border — driven by the caller's own validation state. */
  error?: boolean;
  options?: number[];
  className?: string;
}

/**
 * Compact "Days" field used on cart/enquiry line items. Pairs a free-text
 * number box — so an exact custom duration can always be typed — with an
 * app-themed dropdown of common choices for the one-tap common case.
 * Visually matches the Select component's popup (checkmark, hover state,
 * rounded card, same shadow) but stays small enough to sit inline next to
 * a quantity stepper, unlike Select which is a full-width labeled field.
 */
export function DaysInput({
  value,
  onChange,
  label,
  required,
  error,
  options = DEFAULT_DAY_OPTIONS,
  className = "",
}: DaysInputProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const commit = (n: number) => {
    onChange(String(n));
    setOpen(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className={["relative inline-flex", className].join(" ")} ref={rootRef}>
      <div
        className={[
          "flex h-8 items-stretch overflow-hidden rounded border bg-white dark:bg-graphite-900",
          error
            ? "border-state-danger"
            : "border-graphite-200 focus-within:border-graphite-900 dark:border-graphite-700 dark:focus-within:border-white",
        ].join(" ")}
      >
        <input
          type="number"
          min={1}
          inputMode="numeric"
          required={required}
          aria-label={label}
          aria-invalid={!!error}
          value={value ?? ""}
          onChange={handleInputChange}
          placeholder="—"
          className="w-10 bg-transparent px-2 font-body text-[13px] text-ink outline-none dark:text-ink-inverted"
        />
        <button
          type="button"
          aria-label={`${label} — choose from common durations`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleTriggerKeyDown}
          className="flex w-6 flex-shrink-0 items-center justify-center border-l border-graphite-200 text-graphite-400 transition-colors hover:bg-graphite-50 hover:text-ink dark:border-graphite-700 dark:hover:bg-graphite-800 dark:hover:text-ink-inverted"
        >
          <CaretDown
            aria-hidden="true"
            weight="bold"
            className={["h-3 w-3 transition-transform", open ? "rotate-180" : ""].join(" ")}
          />
        </button>
      </div>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-20 mt-1 max-h-56 w-20 overflow-auto rounded border border-graphite-200 bg-white p-1 shadow-raised outline-none dark:border-graphite-800 dark:bg-graphite-900"
        >
          {options.map((n) => {
            const isSelected = value === String(n);
            return (
              <li
                key={n}
                role="option"
                aria-selected={isSelected}
                onClick={() => commit(n)}
                className={[
                  "flex cursor-pointer items-center justify-between gap-1 rounded px-2 py-1.5 font-body text-[13px]",
                  isSelected
                    ? "bg-graphite-100 font-semibold text-ink dark:bg-graphite-800 dark:text-ink-inverted"
                    : "text-graphite-600 hover:bg-graphite-100 dark:text-graphite-300 dark:hover:bg-graphite-800",
                ].join(" ")}
              >
                {n}
                {isSelected && (
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-ink dark:text-ink-inverted" weight="regular" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
