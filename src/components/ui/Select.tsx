import { forwardRef, type SelectHTMLAttributes } from "react";
import { baseFieldClass } from "./form-field";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  /** Fully-rounded, taller presentation for app-like screens — replaces (not appends to) the default height/radius. */
  pill?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", pill, id, children, ...rest }, ref) => {
    const fieldId = id ?? rest.name;
    const base = pill
      ? baseFieldClass(!!error)
          .replace("h-11", "h-12")
          .replace("rounded ", "rounded-full ")
          .replace("px-3", "px-4")
      : baseFieldClass(!!error);
    return (
      <label className="block" htmlFor={fieldId}>
        {label && (
          <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
            {label}
          </span>
        )}
        <select
          ref={ref}
          id={fieldId}
          className={[base, "appearance-none", className].join(" ")}
          aria-invalid={!!error}
          {...rest}
        >
          {children}
        </select>
        {error && (
          <span className="mt-1 block font-body text-[12px] text-state-danger">{error}</span>
        )}
      </label>
    );
  },
);
Select.displayName = "Select";
