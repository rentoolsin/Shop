/**
 * Authoritative shape + fallback defaults for homepage_content sections.
 * Both the public Home page and the admin editor import from here so the
 * "known section keys" and their content shape are defined once.
 *
 * A section is only rendered from CMS content if a row exists for it,
 * `is_enabled` is true, and `is_published` is true (enforced again by RLS
 * on the read side — see 0001_init_schema.sql). Otherwise the hard-coded
 * default below is used, so the homepage never breaks or goes blank while
 * content is still in draft or a section hasn't been touched in Admin yet.
 */

export const HOMEPAGE_SECTION_KEYS = [
  "hero",
  "why_rentools",
  "how_it_works",
  "contact_location",
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export interface HeroSlide {
  /** Client-generated id, stable for React keys and reordering — never persisted as a DB primary key. */
  id: string;
  imageUrl: string;
  /** Accessible alt text — kept separate from the on-slide caption, which is decorative/overlaid. */
  alt: string;
  /** Optional short caption shown over the image. Falls back to nothing (image-only slide) when blank. */
  caption?: string;
  /** Optional in-app path the slide links to when tapped, e.g. "/products" or "/category/ladders". */
  linkTo?: string;
}

export interface HeroContent {
  heading: string;
  subheading: string;
  /**
   * Optional hero image carousel, managed in Admin. Empty by default so the
   * hero renders exactly as plain heading/subheading text until an admin
   * adds at least one slide — adding this field never breaks an existing,
   * already-published hero row that predates it (`slides` is simply
   * undefined/missing on old rows and treated as empty).
   */
  slides: HeroSlide[];
}

/** Generates a stable client-side id for a new slide (not a DB primary key). */
export function createHeroSlideId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyHeroSlide(): HeroSlide {
  return { id: createHeroSlideId(), imageUrl: "", alt: "" };
}

/**
 * Normalizes hero content read from the DB (current row, a past revision,
 * etc.) so `slides` is always an array — rows saved before the carousel
 * existed simply don't have the key.
 */
export function withHeroDefaults(content: Record<string, unknown>): HeroContent {
  return {
    heading: "",
    subheading: "",
    slides: [],
    ...content,
  } as HeroContent;
}

export interface WhyRentoolsContent {
  points: string[];
}

export interface HowItWorksStep {
  title: string;
  body: string;
}

export interface HowItWorksContent {
  steps: HowItWorksStep[];
}

export interface ContactLocationContent {
  address: string;
}

export interface HomepageSectionContentMap {
  hero: HeroContent;
  why_rentools: WhyRentoolsContent;
  how_it_works: HowItWorksContent;
  contact_location: ContactLocationContent;
}

export const HOMEPAGE_SECTION_LABEL: Record<HomepageSectionKey, string> = {
  hero: "Hero",
  why_rentools: "Why RenTools",
  how_it_works: "How it works",
  contact_location: "Contact & location",
};

/** What the page shows when a section has no published CMS override. */
export const HOMEPAGE_SECTION_DEFAULTS: HomepageSectionContentMap = {
  hero: {
    heading: "Construction tools, ready when your site needs them.",
    subheading: "Browse RenTools' rental inventory in Coimbatore and enquire in a minute.",
    slides: [],
  },
  why_rentools: {
    points: [
      "Tools checked and ready before pickup",
      "Straightforward daily rental pricing",
      "Talk to us directly — call or WhatsApp",
    ],
  },
  how_it_works: {
    steps: [
      { title: "Browse", body: "Look through tools and equipment by category." },
      { title: "Enquire", body: "Send an enquiry or call us about what you need." },
      { title: "Connect", body: "RenTools confirms availability and rate with you." },
      { title: "Arrange rental", body: "Pick up or arrange delivery to your site." },
    ],
  },
  contact_location: {
    address: "Kovilmedu, Coimbatore, Tamil Nadu",
  },
};

export function isHomepageSectionKey(value: string): value is HomepageSectionKey {
  return (HOMEPAGE_SECTION_KEYS as readonly string[]).includes(value);
}
