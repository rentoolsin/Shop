import { Check, CaretDown } from "@phosphor-icons/react";
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
import { FloatingPopup } from "./FloatingPopup";

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
  /**
   * Turns the field into a typeable combobox: click it and start typing to
   * filter the list. Everything else (value / onChange / <option> children)
   * works the same as the plain dropdown.
   */
  searchable?: boolean;
  /** Plain <option value=".."> elements, same as a native select. */
  children?: ReactNode;
}

interface OptionData {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

/** Plain text of an <option>'s children (for filtering and the typeable field's value). */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return "";
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
    <CaretDown
      aria-hidden="true"
      weight="light"
      className={["h-4 w-4 flex-shrink-0 text-graphite-400 transition-transform", open ? "rotate-180" : ""].join(" ")}
    />
  );
}

function CheckIcon() {
  return <Check aria-hidden="true" weight="regular" className="h-4 w-4 flex-shrink-0 text-ink dark:text-ink-inverted" />;
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
  searchable,
  children,
  "aria-label": ariaLabel,
}: SelectProps) {
  const fieldId = id ?? name;
  const options = useMemo(() => extractOptions(children), [children]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
<<<<<<< HEAD
=======
  const inputRef = useRef<HTMLInputElement>(null);
  // Only scroll the highlighted row into view for keyboard navigation / on
  // open — scrolling on mouse-hover would fight the user's own scrolling.
  const scrollActiveIntoView = useRef(false);
>>>>>>> 8780321 (Bug)

  const selectedValue = String(value ?? "");
  const selectedIndex = options.findIndex((o) => o.value === selectedValue);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  // Options currently listed — all of them, or only the ones matching what
  // was typed in a searchable field.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchable || !q) return options;
    return options.filter((o) => nodeText(o.label).toLowerCase().includes(q));
  }, [options, query, searchable]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      // The list is portalled to <body>, so it is outside rootRef in the DOM.
      if (rootRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
<<<<<<< HEAD
=======
      setQuery("");
>>>>>>> 8780321 (Bug)
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === selectedValue);
    scrollActiveIntoView.current = true;
    setActiveIndex(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedValue]);

  useEffect(() => {
    if (!open || !scrollActiveIntoView.current || !fieldId) return;
    scrollActiveIntoView.current = false;
    document.getElementById(`${fieldId}-opt-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  });

  const openList = () => {
    if (disabled) return;
    setOpen((wasOpen) => {
      if (!wasOpen) setQuery("");
      return true;
    });
  };

  const closeList = () => {
    setOpen(false);
    setQuery("");
  };

  const commit = (option: OptionData) => {
    if (option.disabled) return;
    closeList();
    // Drop the on-screen keyboard once a choice is made.
    if (searchable) inputRef.current?.blur();
    if (!onChange) return;
    onChange({ target: { value: option.value, name } } as unknown as ChangeEvent<HTMLSelectElement>);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || (!searchable && e.key === " ")) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      // Close only the list — not a dialog it may be sitting in.
      e.preventDefault();
      e.stopPropagation();
<<<<<<< HEAD
      setOpen(false);
=======
      closeList();
>>>>>>> 8780321 (Bug)
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      scrollActiveIntoView.current = true;
      setActiveIndex((i) => Math.min(visible.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      scrollActiveIntoView.current = true;
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || (!searchable && e.key === " ")) {
      e.preventDefault();
      const opt = visible[activeIndex];
      if (opt) commit(opt);
    } else if (e.key === "Tab") {
      closeList();
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
        {searchable ? (
          <>
            <input
              ref={inputRef}
              type="text"
              id={fieldId}
              role="combobox"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={disabled}
              aria-expanded={open}
              aria-autocomplete="list"
              aria-controls={fieldId ? `${fieldId}-listbox` : undefined}
              aria-invalid={!!error}
              aria-label={ariaLabel ?? label}
              value={open ? query : selectedValue !== "" ? nodeText(selected?.label) : ""}
              placeholder={
                open && selectedValue !== "" ? nodeText(selected?.label) : nodeText(options[0]?.label)
              }
              onFocus={openList}
              onClick={openList}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
                setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              className={[base, "truncate pr-9 placeholder:text-ink dark:placeholder:text-ink-inverted", className].join(" ")}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <ChevronIcon open={open} />
            </span>
          </>
        ) : (
          <button
            type="button"
            id={fieldId}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-invalid={!!error}
            aria-label={ariaLabel ?? label}
            onClick={() => (open ? closeList() : openList())}
            onKeyDown={handleKeyDown}
            className={[base, "flex cursor-pointer items-center justify-between gap-2 text-left", className].join(" ")}
          >
            <span className="truncate">{selected?.label}</span>
            <ChevronIcon open={open} />
          </button>
        )}

        {open && (
          <FloatingPopup
            anchorRef={rootRef}
            popupRef={popupRef}
            matchAnchorWidth
            maxHeight={320}
            className="rounded border border-graphite-200 bg-white p-1 shadow-raised dark:border-graphite-800 dark:bg-graphite-900"
          >
          <ul
            role="listbox"
            id={fieldId ? `${fieldId}-listbox` : undefined}
            tabIndex={-1}
<<<<<<< HEAD
            aria-activedescendant={fieldId && options[activeIndex] ? `${fieldId}-opt-${activeIndex}` : undefined}
=======
            aria-activedescendant={fieldId && visible[activeIndex] ? `${fieldId}-opt-${activeIndex}` : undefined}
            // Keep focus in the typeable field while tapping/clicking the
            // list, so the keyboard doesn't collapse mid-tap and shift the
            // layout out from under the finger.
            onMouseDown={searchable ? (e) => e.preventDefault() : undefined}
>>>>>>> 8780321 (Bug)
            className="outline-none"
          >
            {visible.length === 0 && (
              <li className="px-3 py-2 font-body text-[14px] text-graphite-500">No matches</li>
            )}
            {visible.map((option, index) => {
              const isSelected = option.value === selectedValue;
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
          </FloatingPopup>
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
