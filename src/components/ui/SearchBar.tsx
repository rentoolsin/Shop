import { MagnifyingGlass, X } from "@phosphor-icons/react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  /** Extra classes for the outer field wrapper — e.g. layout hints from the parent row. */
  containerClassName?: string;
  /** Optional trailing control (e.g. a filters icon button) rendered at the end of the field. */
  trailing?: ReactNode;
}

function SearchIcon() {
  return <MagnifyingGlass weight="light" aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-graphite-400" />;
}

/**
 * Canonical search field used across every list page (Rentals, Products, Enquiries,
 * Purchase Requests, Customers) and the customer-facing Home/MagnifyingGlass pages.
 *
 * `w-full` + `sm:flex-1` (rather than a bare `flex-1`) keeps this correctly sized at
 * h-11 whether it sits alone, or beside a filter `Select` in a `flex-col sm:flex-row`
 * row — a bare `flex-1` collapses the field's height when the parent is `flex-col`
 * (mobile), because flex-grow along a column's main axis fights the fixed height.
 */
export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder,
  containerClassName = "",
  trailing,
  id,
  ...rest
}: SearchBarProps) {
  return (
    <div
      className={[
        "flex h-11 w-full min-w-0 items-center gap-2 rounded border border-graphite-200 bg-white px-3 shadow-card",
        "dark:border-graphite-800 dark:bg-graphite-900",
        "sm:w-auto sm:flex-1",
        containerClassName,
      ].join(" ")}
    >
      <SearchIcon />
      <input
        id={id}
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 overflow-hidden text-ellipsis bg-transparent font-body text-[14px] text-ink outline-none placeholder:text-graphite-400 dark:text-ink-inverted"
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange(""))}
          aria-label="Clear search"
          className="-mr-1.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-graphite-400 transition-colors active:bg-graphite-100 dark:active:bg-graphite-800"
        >
          <X className="h-3.5 w-3.5" weight="regular" />
        </button>
      )}
    </div>
  );
}
