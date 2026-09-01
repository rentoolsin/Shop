import { Link } from "react-router-dom";
import { Plus } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useAuth } from "../../lib/auth";

interface SnapshotChip {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}

interface DashboardHeroProps {
  chips: SnapshotChip[];
}

function greetingForHour(hour: number): string {
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Working late";
}

/**
 * Dark gradient "command center" banner at the top of the Dashboard —
 * greeting, live status, quick actions, and a row of at-a-glance snapshot
 * chips. Reads directly from the same session the shared AdminLayout sign-
 * out control uses, so the greeting stays accurate without an extra fetch.
 */
export function DashboardHero({ chips }: DashboardHeroProps) {
  const { session } = useAuth();
  const now = new Date();
  const firstName = session?.user.email?.split("@")[0]?.replace(/[._-]+/g, " ") ?? "there";

  return (
    <div className="relative overflow-hidden rounded bg-gradient-to-br from-graphite-900 via-graphite-900 to-graphite-950 px-5 py-6 shadow-premium-lg sm:px-8 sm:py-8">
      {/* Decorative ambient glows — purely visual, clipped by the panel's own overflow-hidden. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-state-info/10 blur-[100px]"
      />

      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-body text-[11px] font-medium text-graphite-300 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-state-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-state-success" />
            </span>
            Live · synced in real time
          </div>
          <h1 className="font-display text-[22px] font-bold capitalize tracking-tight text-white sm:text-[26px]">
            {greetingForHour(now.getHours())}, {firstName}
          </h1>
          <p className="mt-1 font-body text-[13px] text-graphite-400">
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Link
            to="/admin/purchase-requests/new"
            className="hidden items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3.5 py-2.5 font-body text-[13px] font-medium text-white backdrop-blur-sm transition-colors duration-150 ease-app hover:bg-white/10 sm:flex"
          >
            <Plus className="h-4 w-4" weight="bold" />
            Purchase request
          </Link>
          <Link
            to="/admin/rentals/new"
            className="flex items-center gap-1.5 rounded bg-gradient-to-b from-accent-400 to-accent-500 px-3.5 py-2.5 font-body text-[13px] font-semibold text-graphite-950 shadow-glow-accent transition-transform duration-150 ease-app hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="h-4 w-4" weight="bold" />
            New rental
          </Link>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-2.5">
        {chips.map((chip) => (
          <div
            key={chip.label}
            className="flex min-w-[132px] flex-1 items-center gap-2.5 rounded border border-white/10 bg-white/[0.04] px-3.5 py-2.5 backdrop-blur-sm sm:flex-none"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-white/10 text-white">
              {chip.icon}
            </span>
            <div className="min-w-0">
              <p className="truncate font-mono text-[15px] font-semibold leading-tight text-white">{chip.value}</p>
              <p className="truncate font-body text-[11px] text-graphite-400">{chip.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
