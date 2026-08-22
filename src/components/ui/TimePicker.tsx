import { Check, Clock } from "@phosphor-icons/react";
import { forwardRef, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { baseFieldClass } from "./form-field";

type Period = "AM" | "PM";

interface TimePickerProps {
  label?: string;
  name?: string;
  id?: string;
  /** 24-hour "HH:mm" string — same shape `<input type="time">` used. */
  value?: string;
  onChange: (value: string) => void;
  /** Minute increments shown in the picker. Default 5. */
  minuteStep?: number;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

function parseTime(value?: string): { hour24: number; minute: number } | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const hour24 = Number(m[1]);
  const minute = Number(m[2]);
  if (hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) return null;
  return { hour24, minute };
}

function to12Hour(hour24: number): { hour12: number; period: Period } {
  const period: Period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, period };
}

function to24Hour(hour12: number, period: Period): number {
  if (period === "AM") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function formatDisplayTime(hour24: number, minute: number): string {
  const { hour12, period } = to12Hour(hour24);
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * App-themed hour / minute / AM-PM picker. Same value-as-24-hour-"HH:mm"-
 * string / onChange contract a native `<input type="time">` field would
 * give a consumer, but renders our own popup so it matches the rest of the
 * app instead of OS chrome — same rationale as `DatePicker` / `Select`.
 * Not wired into any page yet (nothing in the app collects a time today),
 * but ready alongside them for the next feature that needs one (a
 * delivery slot, opening hours, etc.) instead of a page-local one-off.
 */
export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker(
  {
    label,
    name,
    id,
    value,
    onChange,
    minuteStep = 5,
    required,
    error,
    hint,
    placeholder = "Select time",
    disabled,
    className = "",
    "aria-label": ariaLabel,
  },
  ref,
) {
  const fieldId = id ?? name;
  const parsed = useMemo(() => parseTime(value), [value]);
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

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => {
    const out: number[] = [];
    for (let m = 0; m < 60; m += minuteStep) out.push(m);
    return out;
  }, [minuteStep]);

  const current = parsed ? to12Hour(parsed.hour24) : null;
  const currentHour12 = current?.hour12 ?? 12;
  const currentMinute = parsed?.minute ?? 0;
  const currentPeriod = current?.period ?? "AM";

  const commit = (hour12: number, minute: number, period: Period) => {
    const hour24 = to24Hour(hour12, period);
    onChange(`${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  };

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
    } else if (open && e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const optionClass = (isSelected: boolean) =>
    [
      "flex w-full items-center justify-between gap-1 rounded px-2 py-1.5 text-left font-body text-[13px]",
      isSelected
        ? "bg-graphite-100 font-semibold text-ink dark:bg-graphite-800 dark:text-ink-inverted"
        : "text-graphite-600 hover:bg-graphite-100 dark:text-graphite-300 dark:hover:bg-graphite-800",
    ].join(" ");

  return (
    <div className="block">
      {label && (
        <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
          {label}
        </span>
      )}
      <div className="relative" ref={rootRef}>
        <button
          ref={ref}
          type="button"
          id={fieldId}
          name={name}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={!!error}
          aria-required={required}
          aria-label={ariaLabel ?? label}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleTriggerKeyDown}
          className={[
            baseFieldClass(!!error),
            "flex cursor-pointer items-center justify-between gap-2 text-left",
            className,
          ].join(" ")}
        >
          <span className={["truncate", parsed ? "" : "text-graphite-400"].join(" ")}>
            {parsed ? formatDisplayTime(parsed.hour24, parsed.minute) : placeholder}
          </span>
          <Clock aria-hidden="true" weight="light" className="h-4 w-4 flex-shrink-0 text-graphite-400" />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label={label ?? "Choose time"}
            className="absolute z-20 mt-1 flex w-48 gap-1 rounded border border-graphite-200 bg-white p-2 shadow-raised dark:border-graphite-800 dark:bg-graphite-900"
          >
            <ul role="listbox" aria-label="Hour" className="max-h-48 flex-1 overflow-auto">
              {hours.map((h) => {
                const isSelected = h === currentHour12;
                return (
                  <li key={h}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => commit(h, currentMinute, currentPeriod)}
                      className={optionClass(isSelected)}
                    >
                      {h}
                      {isSelected && <Check aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" weight="regular" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <ul role="listbox" aria-label="Minute" className="max-h-48 flex-1 overflow-auto">
              {minutes.map((m) => {
                const isSelected = m === currentMinute;
                return (
                  <li key={m}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => commit(currentHour12, m, currentPeriod)}
                      className={optionClass(isSelected)}
                    >
                      {String(m).padStart(2, "0")}
                      {isSelected && <Check aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" weight="regular" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <ul role="listbox" aria-label="AM or PM" className="flex-shrink-0 self-start">
              {(["AM", "PM"] as const).map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={p === currentPeriod}
                    onClick={() => commit(currentHour12, currentMinute, p)}
                    className={optionClass(p === currentPeriod)}
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {hint && !error && <span className="mt-1 block font-body text-[12px] text-graphite-500">{hint}</span>}
      {error && (
        <span
          id={fieldId ? `${fieldId}-error` : undefined}
          className="mt-1 block font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark"
        >
          {error}
        </span>
      )}
    </div>
  );
});
