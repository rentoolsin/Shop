import { supabase } from "../lib/supabase";
import {
  HOMEPAGE_SECTION_DEFAULTS,
  HOMEPAGE_SECTION_KEYS,
  type HomepageSectionContentMap,
  type HomepageSectionKey,
} from "../utils/homepage-content";

export interface AdminHomepageSection<K extends HomepageSectionKey = HomepageSectionKey> {
  sectionKey: K;
  content: HomepageSectionContentMap[K];
  isEnabled: boolean;
  isPublished: boolean;
  sortOrder: number;
  updatedAt: string | null;
  /** True when no row exists yet in `homepage_content` for this section — it's showing the built-in default. */
  isUnconfigured: boolean;
}

export interface HomepageRevision {
  id: string;
  content: Record<string, unknown>;
  createdAt: string;
}

type HomepageContentRow = {
  section_key: string;
  content: Record<string, unknown>;
  is_enabled: boolean;
  is_published: boolean;
  sort_order: number;
  updated_at: string;
};

/**
 * Every known section, always in the fixed `HOMEPAGE_SECTION_KEYS` order —
 * merges whatever rows exist in `homepage_content` with defaults for
 * sections nobody has edited yet, so the admin list always shows the full
 * fixed set of sections rather than only rows that happen to exist.
 */
export async function fetchAllHomepageSections(): Promise<AdminHomepageSection[]> {
  const { data, error } = await supabase
    .from("homepage_content")
    .select("section_key, content, is_enabled, is_published, sort_order, updated_at");
  if (error) throw error;

  const rows = new Map<string, HomepageContentRow>(
    ((data ?? []) as HomepageContentRow[]).map((row) => [row.section_key, row]),
  );

  return HOMEPAGE_SECTION_KEYS.map((key, index) => {
    const row = rows.get(key);
    if (!row) {
      return {
        sectionKey: key,
        content: HOMEPAGE_SECTION_DEFAULTS[key],
        isEnabled: true,
        isPublished: false,
        sortOrder: index,
        updatedAt: null,
        isUnconfigured: true,
      };
    }
    return {
      sectionKey: key,
      content: row.content as unknown as HomepageSectionContentMap[typeof key],
      isEnabled: row.is_enabled,
      isPublished: row.is_published,
      sortOrder: row.sort_order,
      updatedAt: row.updated_at,
      isUnconfigured: false,
    };
  });
}

export async function fetchHomepageSection<K extends HomepageSectionKey>(
  key: K,
): Promise<AdminHomepageSection<K> | null> {
  const sections = await fetchAllHomepageSections();
  const match = sections.find((s) => s.sectionKey === key);
  return (match as AdminHomepageSection<K> | undefined) ?? null;
}

/**
 * Saves a section's content/enabled/sort-order and snapshots whatever was
 * live immediately before this write into `homepage_content_revisions`,
 * so the editor can show history and restore an earlier version. Does not
 * change `is_published` — use `setHomepageSectionPublished` for that, so
 * "save a draft" and "publish" stay two explicit, separate actions.
 */
export async function saveHomepageSectionContent<K extends HomepageSectionKey>(
  key: K,
  values: { content: HomepageSectionContentMap[K]; isEnabled: boolean; sortOrder: number },
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("homepage_content")
    .select("content")
    .eq("section_key", key)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (existing) {
    const { error: revisionError } = await supabase
      .from("homepage_content_revisions")
      .insert({ section_key: key, content: existing.content });
    if (revisionError) throw revisionError;

    // Existing row: update content only. Publish state is left exactly as
    // it was — a content edit on an already-published section stays live
    // with the new content; publishing/unpublishing is a separate, explicit
    // action via setHomepageSectionPublished.
    const { error } = await supabase
      .from("homepage_content")
      .update({
        content: values.content as unknown as Record<string, unknown>,
        is_enabled: values.isEnabled,
        sort_order: values.sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq("section_key", key);
    if (error) throw error;
    return;
  }

  // No row yet for this section: create one, starting unpublished (draft)
  // until the admin explicitly publishes it.
  const { error } = await supabase.from("homepage_content").insert({
    section_key: key,
    content: values.content as unknown as Record<string, unknown>,
    is_enabled: values.isEnabled,
    sort_order: values.sortOrder,
    is_published: false,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function setHomepageSectionPublished(
  key: HomepageSectionKey,
  isPublished: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("homepage_content")
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq("section_key", key);
  if (error) throw error;
}

export async function fetchHomepageRevisions(
  key: HomepageSectionKey,
): Promise<HomepageRevision[]> {
  const { data, error } = await supabase
    .from("homepage_content_revisions")
    .select("id, content, created_at")
    .eq("section_key", key)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, content: r.content, createdAt: r.created_at }));
}

/** Restores a past revision's content as the section's current (still-draft) content. */
export async function restoreHomepageRevision<K extends HomepageSectionKey>(
  key: K,
  revisionContent: HomepageSectionContentMap[K],
  isEnabled: boolean,
  sortOrder: number,
): Promise<void> {
  await saveHomepageSectionContent(key, { content: revisionContent, isEnabled, sortOrder });
}
