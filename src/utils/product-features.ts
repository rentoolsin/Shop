/**
 * Products only have a single free-text `description` column (see
 * supabase/migrations/0001_init_schema.sql) — there's no separate
 * "highlights" field, and seed data intentionally avoids inventing specs
 * (see supabase/seed.sql). So an admin who wants short bullet highlights
 * under "About this tool" (e.g. "Powerful motor for smooth cutting") can
 * write them as extra lines in the same description field:
 *
 *   High performance pipe cutting machine suitable for MS, GI pipes and
 *   metal cutting on site.
 *   - Powerful motor for smooth cutting
 *   - Rust proof and heavy duty base
 *   - Safe, precise and easy to use
 *
 * The first line (or paragraph, if it spans multiple lines with no "- "
 * lines yet) is the intro copy shown directly under the title. Any
 * subsequent lines starting with "-" or "•" become bullet highlights.
 * A description with no bullet lines just renders as plain body copy —
 * this is a progressive-enhancement convention, not a required format.
 */
export interface ParsedProductDescription {
  intro: string | null;
  highlights: string[];
}

export function parseProductDescription(
  description: string | null,
): ParsedProductDescription {
  if (!description) return { intro: null, highlights: [] };

  const lines = description.split("\n").map((line) => line.trim());
  const bulletPrefix = /^[-•]\s*/;

  const introLines: string[] = [];
  const highlights: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    if (bulletPrefix.test(line)) {
      highlights.push(line.replace(bulletPrefix, ""));
    } else if (highlights.length === 0) {
      introLines.push(line);
    }
  }

  return {
    intro: introLines.length ? introLines.join(" ") : null,
    highlights,
  };
}
