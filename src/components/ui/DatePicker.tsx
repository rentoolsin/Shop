import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { forwardRef, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { baseFieldClass } from "./form-field";
import { toLocalISODate } from "../../utils/date-range";

interface DatePickerProps {
  label?: string;
  name?: string;
  id?: string;
  /** ISO date string, "YYYY-MM-DD" — same shape `<input type="date">` used. */
  value?: string;
  onChange: (value: string) => void;
  /** ISO date strings — days outside this window are shown disabled. */
  min?: string;
  max?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseISODate(value?: string): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Mon-first-of-week grid cells for a given month, padded to full weeks with nulls. */
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * App-themed calendar date picker. Same value-as-ISO-string / onChange
 * contract a native `<input type="date">` field had, so every call site
 * only needed the tag swapped — but renders our own popup grid instead of
 * the browser's native date control, which can't be restyled and always
 * looks like OS chrome rather than the app (same rationale as `Select`).
 */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  {
    label,
    name,
    id,
    value,
    onChange,
    min,
    max,
    required,
    error,
    hint,
    placeholder = "Select date",
    disabled,
    className = "",
    "aria-label": ariaLabel,
  },
  ref,
) {
  const fieldId = id ?? name;
  const selected = useMemo(() => parseISODate(value), [value]);
  const minDate = useMemo(() => parseISODate(min), [min]);
  const maxDate = useMemo(() => parseISODate(max), [max]);
  const today = useMemo(() => new Date(), []);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => (selected ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected ?? today).getMonth());
  // Popup placement flips to whichever side actually has room, computed
  // fresh each time it opens (see below) — see the comment on the popup
  // wrapper for why this can't just be a fixed "always open downward".
  const [openUpward, setOpenUpward] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const base = selected ?? today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    // Only re-sync the visible month when the popup opens, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  // Decide which way the popup should open. On mobile, form fields are
  // frequently within a screen-height or two of the fixed bottom nav/tab
  // bar (z-40): a popup that always drops downward can render partly (or
  // entirely) underneath that bar, making its lower rows of dates visible
  // but unclickable since the nav bar sits on top and eats the taps. So on
  // every open we measure real space against the viewport — not just the
  // trigger's position in the page — and flip up/left as needed. Re-runs
  // on resize/orientation change while open, since rotating the phone or
  // the on-screen keyboard appearing changes the viewport height.
  useEffect(() => {
    if (!open) return;
    const PLACEMENT_ESTIMATE_HEIGHT = 336;
    const PLACEMENT_ESTIMATE_WIDTH = 256;
    const VIEWPORT_MARGIN = 8;

    function recomputePlacement() {
      const triggerEl = rootRef.current;
      if (!triggerEl) return;
      const rect = triggerEl.getBoundingClientRect();
      const popupHeight = popupRef.current?.offsetHeight || PLACEMENT_ESTIMATE_HEIGHT;
      const popupWidth = popupRef.current?.offsetWidth || PLACEMENT_ESTIMATE_WIDTH;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Prefer opening downward (the natural reading direction); only flip
      // up if there truly isn't room below but there is above.
      setOpenUpward(spaceBelow < popupHeight + VIEWPORT_MARGIN && spaceAbove > spaceBelow);

      const spaceRight = viewportWidth - rect.left;
      setAlignRight(spaceRight < popupWidth + VIEWPORT_MARGIN && rect.right >= popupWidth);
    }

    recomputePlacement();
    // Measure again after the popup has actually mounted/rendered, since
    // its real height depends on content (e.g. which month is showing).
    const raf = requestAnimationFrame(recomputePlacement);
    window.addEventListener("resize", recomputePlacement);
    window.addEventListener("scroll", recomputePlacement, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recomputePlacement);
      window.removeEventListener("scroll", recomputePlacement, true);
    };
  }, [open, viewMonth, viewYear]);

  const isDisabledDate = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const commit = (date: Date) => {
    if (isDisabledDate(date)) return;
    onChange(toLocalISODate(date));
    setOpen(false);
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

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const goToPrevMonth = () =>
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });

  const goToNextMonth = () =>
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });

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
          <span className={["truncate", selected ? "" : "text-graphite-400"].join(" ")}>
            {selected ? formatDisplayDate(selected) : placeholder}
          </span>
          <CalendarBlank aria-hidden="true" weight="light" className="h-4 w-4 flex-shrink-0 text-graphite-400" />
        </button>

        {open && (
          <div
            ref={popupRef}
            role="dialog"
            aria-label={label ?? "Choose date"}
            className={[
              // z-50 so the popup always sits above the admin/customer fixed
              // bottom nav bars (z-40) instead of getting tapped through.
              "absolute z-50 w-64 rounded border border-graphite-200 bg-white p-3 shadow-raised dark:border-graphite-800 dark:bg-graphite-900",
              openUpward ? "bottom-full mb-1" : "top-full mt-1",
              alignRight ? "right-0" : "left-0",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={goToPrevMonth}
                className="flex h-7 w-7 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 hover:text-ink dark:hover:bg-graphite-800 dark:hover:text-ink-inverted"
              >
                <CaretLeft aria-hidden="true" weight="bold" className="h-3.5 w-3.5" />
              </button>
              <span className="font-body text-[13px] font-semibold text-ink dark:text-ink-inverted">
                {MONTH_LABELS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={goToNextMonth}
                className="flex h-7 w-7 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 hover:text-ink dark:hover:bg-graphite-800 dark:hover:text-ink-inverted"
              >
                <CaretRight aria-hidden="true" weight="bold" className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-7 gap-y-1">
              {WEEKDAY_LABELS.map((d, i) => (
                <span
                  key={i}
                  className="flex h-7 items-center justify-center font-body text-[11px] font-medium text-graphite-400"
                >
                  {d}
                </span>
              ))}
              {grid.map((date, i) => {
                if (!date) return <span key={i} />;
                const isSelected = selected ? isSameDay(date, selected) : false;
                const isToday = isSameDay(date, today);
                const disabledDay = isDisabledDate(date);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabledDay}
                    aria-current={isToday ? "date" : undefined}
                    aria-selected={isSelected}
                    onClick={() => commit(date)}
                    className={[
                      "flex h-7 w-7 items-center justify-center justify-self-center rounded-full font-body text-[12.5px] transition-colors",
                      disabledDay
                        ? "cursor-not-allowed text-graphite-300 dark:text-graphite-700"
                        : "cursor-pointer text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800",
                      isSelected ? "bg-accent-500 font-semibold text-ink hover:bg-accent-500" : "",
                      !isSelected && isToday
                        ? "font-semibold ring-1 ring-inset ring-graphite-300 dark:ring-graphite-700"
                        : "",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {!required && selected && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="mt-2 w-full rounded px-2 py-1.5 text-center font-body text-[12px] text-graphite-500 hover:bg-graphite-100 hover:text-ink dark:hover:bg-graphite-800 dark:hover:text-ink-inverted"
              >
                Clear date
              </button>
            )}
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
