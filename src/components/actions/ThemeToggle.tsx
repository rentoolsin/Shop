import { Monitor, Moon, Sun } from "lucide-react";
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
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-graphite-500 transition-colors duration-150 ease-app hover:bg-graphite-100 hover:text-ink dark:hover:bg-graphite-800 dark:hover:text-ink-inverted"
    >
      {preference === "system" && <Monitor className="h-[18px] w-[18px]" strokeWidth={1.6} />}
      {preference === "light" && <Sun className="h-[18px] w-[18px]" strokeWidth={1.6} />}
      {preference === "dark" && <Moon className="h-[18px] w-[18px]" strokeWidth={1.6} />}
    </button>
  );
}
