import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { baseFieldClass } from "./form-field";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...rest }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? rest.name ?? generatedId;
    return (
      <label className="block" htmlFor={fieldId}>
        {label && (
          <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
            {label}
          </span>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          className={[baseFieldClass(!!error), "min-h-24 h-auto resize-none py-2", className].join(" ")}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...rest}
        />
        {error && (
          <span id={`${fieldId}-error`} className="mt-1 block font-body text-[12px] text-state-danger">
            {error}
          </span>
        )}
      </label>
    );
  },
);
Textarea.displayName = "Textarea";
