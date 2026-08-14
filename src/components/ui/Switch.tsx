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
        className={[
          "relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-150 ease-app",
          checked ? "bg-signal-500" : "bg-graphite-300 dark:bg-graphite-700",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform duration-150 ease-app",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </label>
  );
}
