import { forwardRef, type SelectHTMLAttributes } from "react";
import { baseFieldClass } from "./form-field";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", id, children, ...rest }, ref) => {
    const fieldId = id ?? rest.name;
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
          className={[baseFieldClass(!!error), "appearance-none", className].join(" ")}
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
