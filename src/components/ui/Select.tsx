import { Check, ChevronDown } from "lucide-react";
import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { baseFieldClass } from "./form-field";

interface SelectProps {
  label?: string;
  error?: string;
  /** Fully-rounded, taller presentation for app-like screens — replaces (not appends to) the default height/radius. */
  pill?: boolean;
  className?: string;
  id?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  "aria-label"?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  /** Plain <option value=".."> elements, same as a native select. */
  children?: ReactNode;
}

interface OptionData {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

function extractOptions(children: ReactNode): OptionData[] {
  const options: OptionData[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement<{ value?: string; children?: ReactNode; disabled?: boolean }>(child)) {
      options.push({
        value: String(child.props.value ?? ""),
        label: child.props.children,
        disabled: child.props.disabled,
      });
    }
  });
  return options;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <ChevronDown
      aria-hidden="true"
      strokeWidth={1.6}
      className={["h-4 w-4 flex-shrink-0 text-graphite-400 transition-transform", open ? "rotate-180" : ""].join(" ")}
    />
  );
}

function CheckIcon() {
  return <Check aria-hidden="true" strokeWidth={1.8} className="h-4 w-4 flex-shrink-0 text-ink dark:text-ink-inverted" />;
}

/**
 * App-themed dropdown with the same public API as a native <select> (value /
 * onChange / <option> children), so every call site is unchanged. We render
 * our own popup instead of the browser's native listbox — the native one
 * can't be styled and always looks like plain OS chrome, not the app.
 */
export function Select({
  label,
  error,
  className = "",
  pill,
  id,
  name,
  value,
  disabled,
  onChange,
  children,
  "aria-label": ariaLabel,
}: SelectProps) {
  const fieldId = id ?? name;
  const options = useMemo(() => extractOptions(children), [children]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex((o) => o.value === String(value ?? ""));
  const selected = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, selectedIndex]);

  const commit = (option: OptionData) => {
    if (option.disabled) return;
    setOpen(false);
    if (!onChange) return;
    onChange({ target: { value: option.value, name } } as unknown as ChangeEvent<HTMLSelectElement>);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) commit(opt);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const base = pill
    ? baseFieldClass(!!error)
        .replace("h-11", "h-12")
        .replace("rounded", "rounded-full")
        .replace("px-3", "px-4")
    : baseFieldClass(!!error);

  return (
    <div className="block">
      {label && (
        <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
          {label}
        </span>
      )}
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          id={fieldId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={!!error}
          aria-label={ariaLabel ?? label}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleKeyDown}
          className={[base, "flex cursor-pointer items-center justify-between gap-2 text-left", className].join(" ")}
        >
          <span className="truncate">{selected?.label}</span>
          <ChevronIcon open={open} />
        </button>

        {open && (
          <ul
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={fieldId && options[activeIndex] ? `${fieldId}-opt-${activeIndex}` : undefined}
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border border-graphite-200 bg-white p-1 shadow-raised outline-none dark:border-graphite-800 dark:bg-graphite-900"
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  id={fieldId ? `${fieldId}-opt-${index}` : undefined}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(option)}
                  className={[
                    "flex cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 font-body text-[14px]",
                    option.disabled ? "cursor-not-allowed opacity-50" : "",
                    isActive && !option.disabled ? "bg-graphite-100 dark:bg-graphite-800" : "",
                    isSelected ? "font-semibold text-ink dark:text-ink-inverted" : "text-graphite-600 dark:text-graphite-300",
                  ].join(" ")}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <CheckIcon />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && (
        <span className="mt-1 block font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">
          {error}
        </span>
      )}
    </div>
  );
}
