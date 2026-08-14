interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

export function Switch({ checked, onChange, label, id }: SwitchProps) {
  const switchId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={switchId} className="flex items-center justify-between gap-3 py-1">
      <span className="font-body text-[14px] text-ink dark:text-ink-inverted">{label}</span>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        // appearance-none + explicit border/padding/margin resets: mobile
        // Safari applies native button chrome (padding, background, border)
        // to <button> elements unless appearance is reset, which was
        // inflating this track past its intended 44px width and clipping
        // it off the edge of narrow screens. box-border + shrink-0 pin the
        // track to a fixed, non-negotiable size regardless of flex parent;
        // overflow-hidden is a hard guarantee the thumb can never render
        // outside the track even if a transform value is ever wrong.
        className={[
          "relative box-border h-6 w-11 flex-shrink-0 shrink-0 appearance-none overflow-hidden",
          "rounded-full border-0 p-0 m-0 transition-colors duration-150 ease-app",
          checked ? "bg-graphite-900 dark:bg-white" : "bg-graphite-300 dark:bg-graphite-700",
        ].join(" ")}
        style={{ WebkitAppearance: "none", minWidth: 44, maxWidth: 44 }}
      >
        <span
          className={[
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full shadow-card transition-transform duration-150 ease-app",
            checked ? "bg-white dark:bg-graphite-950" : "bg-white",
          ].join(" ")}
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </label>
  );
}
