import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { baseFieldClass } from "./form-field";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, trailing, className = "", id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <label className="block" htmlFor={inputId}>
        {label && (
          <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
            {label}
          </span>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={[baseFieldClass(!!error), trailing ? "pr-9" : "", className].join(" ")}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...rest}
          />
          {trailing && (
            <span className="absolute inset-y-0 right-2 flex items-center text-graphite-400">
              {trailing}
            </span>
          )}
        </div>
        {hint && !error && (
          <span className="mt-1 block font-body text-[12px] text-graphite-400">{hint}</span>
        )}
        {error && (
          <span id={`${inputId}-error`} className="mt-1 block font-body text-[12px] text-state-danger">
            {error}
          </span>
        )}
      </label>
    );
  },
);
Input.displayName = "Input";
