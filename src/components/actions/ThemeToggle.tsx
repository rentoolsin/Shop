import { Monitor, Moon, Sun } from "@phosphor-icons/react";
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
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-graphite-600 shadow-card ring-1 ring-graphite-200 transition-all duration-150 ease-app active:scale-90 dark:bg-graphite-800 dark:text-ink-inverted dark:ring-graphite-700"
    >
      {preference === "system" && <Monitor className="h-[18px] w-[18px]" weight="light" />}
      {preference === "light" && <Sun className="h-[18px] w-[18px]" weight="light" />}
      {preference === "dark" && <Moon className="h-[18px] w-[18px]" weight="light" />}
    </button>
  );
}
