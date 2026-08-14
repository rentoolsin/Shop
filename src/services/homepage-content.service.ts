import { supabase } from "../lib/supabase";
import {
  HOMEPAGE_SECTION_DEFAULTS,
  isHomepageSectionKey,
  type HomepageSectionContentMap,
  type HomepageSectionKey,
} from "../utils/homepage-content";

/**
 * Resolves the content the public Home page should render for every known
 * section: the published CMS override if one exists and the section is
 * enabled, otherwise the hard-coded default. A section can also be
 * disabled entirely (`is_enabled = false`), in which case it's omitted
 * from `hidden` so Home.tsx can skip rendering it.
 */
export interface ResolvedHomepageContent {
  content: HomepageSectionContentMap;
  hiddenSections: Set<HomepageSectionKey>;
}

export async function fetchPublishedHomepageContent(): Promise<ResolvedHomepageContent> {
  // RLS already restricts anon reads to `is_published = true` rows (see
  // 0001_init_schema.sql) — the `.eq` here just avoids relying on that
  // silently in case an admin session is also reading this on the public
  // site preview.
  const { data, error } = await supabase
    .from("homepage_content")
    .select("section_key, content, is_enabled")
    .eq("is_published", true);

  if (error) throw error;

  const content: HomepageSectionContentMap = { ...HOMEPAGE_SECTION_DEFAULTS };
  const hiddenSections = new Set<HomepageSectionKey>();

  for (const row of data ?? []) {
    if (!isHomepageSectionKey(row.section_key)) continue; // ignore unknown/future keys
    if (!row.is_enabled) {
      hiddenSections.add(row.section_key);
      continue;
    }
    applySectionContent(content, row.section_key, row.content);
  }

  return { content, hiddenSections };
}

function applySectionContent<K extends HomepageSectionKey>(
  content: HomepageSectionContentMap,
  key: K,
  value: unknown,
): void {
  content[key] = value as HomepageSectionContentMap[K];
}
