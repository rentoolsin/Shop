import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-graphite-900 text-graphite-25 hover:bg-graphite-800 active:bg-graphite-950 " +
    "dark:bg-white dark:text-graphite-950 dark:hover:bg-graphite-200",
  secondary:
    "bg-graphite-100 text-ink hover:bg-graphite-200 active:bg-graphite-300 " +
    "dark:bg-graphite-800 dark:text-ink-inverted dark:hover:bg-graphite-700",
  ghost:
    "bg-transparent text-ink hover:bg-graphite-100 active:bg-graphite-200 " +
    "dark:text-ink-inverted dark:hover:bg-graphite-800",
  danger:
    "bg-state-danger text-white hover:brightness-110 active:brightness-95",
  accent:
    "bg-accent-500 text-graphite-950 font-semibold hover:bg-accent-400 active:bg-accent-600",
  outline:
    "bg-white text-ink border border-graphite-300 hover:bg-graphite-50 active:bg-graphite-100 " +
    "dark:bg-graphite-900 dark:border-graphite-700 dark:text-ink-inverted dark:hover:bg-graphite-800",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5",
  md: "h-11 px-4 text-[15px] gap-2",
  lg: "h-12 px-5 text-[16px] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", fullWidth, className = "", disabled, ...rest },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          "inline-flex items-center justify-center rounded font-body font-medium",
          "transition-colors duration-150 ease-app select-none",
          "disabled:opacity-40 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? "w-full" : "",
          className,
        ].join(" ")}
        {...rest}
      />
    );
  },
);
Button.displayName = "Button";
