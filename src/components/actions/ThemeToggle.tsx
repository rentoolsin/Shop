import { useTheme } from "../../lib/theme";

const CYCLE = ["system", "light", "dark"] as const;

const LABEL: Record<(typeof CYCLE)[number], string> = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
};

/**
 * Small header icon button that cycles theme preference: system → light →
 * dark → system. Defaults to "system" (see `useTheme`/`readStoredPreference`
 * in `lib/theme.tsx` — nothing written to localStorage until the user
 * actively picks light or dark), this is purely the UI to change it.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  const cycleNext = () => {
    const i = CYCLE.indexOf(preference);
    setPreference(CYCLE[(i + 1) % CYCLE.length]);
  };

  return (
    <button
      type="button"
      onClick={cycleNext}
      aria-label={`Theme: ${LABEL[preference]}. Tap to change.`}
      title={LABEL[preference]}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-graphite-500 transition-colors duration-150 ease-app hover:bg-graphite-100 hover:text-ink dark:hover:bg-graphite-800 dark:hover:text-ink-inverted"
    >
      {preference === "system" && (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-[18px] w-[18px]">
          <rect x="3" y="4" width="18" height="12" rx="1.5" stroke="currentColor" />
          <path d="M8 20h8M12 16v4" stroke="currentColor" strokeLinecap="round" />
        </svg>
      )}
      {preference === "light" && (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-[18px] w-[18px]">
          <circle cx="12" cy="12" r="4" stroke="currentColor" />
          <path
            d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      )}
      {preference === "dark" && (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-[18px] w-[18px]">
          <path
            d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
