import { useEffect } from "react";

const SITE_NAME = "RenTools";

interface DocumentMetaOptions {
  /** Page-specific title. Formatted as "{title} | RenTools", except when
   * title already *is* the site name (Home), which is used as-is. */
  title: string;
  /** Page-specific description for the meta tag and Open Graph/Twitter previews.
   * Omit to leave the static index.html default in place. */
  description?: string;
  /** Low-value/per-visitor routes (search results, enquiry/purchase forms and
   * their confirmations, 404) shouldn't be indexed or dilute crawl budget. */
  noindex?: boolean;
  /** JSON-LD structured data (e.g. Product/Offer) to inject for this route only.
   * Cleaned up on unmount so it never leaks onto the next page. */
  structuredData?: Record<string, unknown>;
}

function setMetaByName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaByProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMetaByProperty(property: string) {
  document.querySelector(`meta[property="${property}"]`)?.remove();
}

/**
 * Sets per-route document title, meta description, canonical link,
 * Open Graph/Twitter preview tags, robots indexing, and (optionally) a
 * JSON-LD structured-data script — all applied on mount and reverted (or
 * refreshed) on unmount/dependency change so one page's metadata never
 * leaks onto the next during client-side navigation.
 *
 * Canonical/og:url are built from `window.location.origin` at runtime
 * rather than hardcoded, since no production domain is defined anywhere
 * in this repo (see index.html) — a guessed one would ship a wrong
 * canonical/share-preview URL.
 */
export function useDocumentMeta({ title, description, noindex, structuredData }: DocumentMetaOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;

    const descriptionEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = descriptionEl?.getAttribute("content") ?? null;
    if (description) {
      setMetaByName("description", description);
    }

    const robotsEl = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robotsEl?.getAttribute("content") ?? null;
    setMetaByName("robots", noindex ? "noindex, nofollow" : "index, follow");

    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousCanonical = canonicalEl?.getAttribute("href") ?? null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonicalUrl);

    setMetaByProperty("og:title", document.title);
    setMetaByProperty("og:url", canonicalUrl);
    if (description) {
      setMetaByProperty("og:description", description);
    }

    let structuredDataEl: HTMLScriptElement | null = null;
    if (structuredData) {
      structuredDataEl = document.createElement("script");
      structuredDataEl.type = "application/ld+json";
      structuredDataEl.setAttribute("data-route-structured-data", "true");
      structuredDataEl.textContent = JSON.stringify(structuredData);
      document.head.appendChild(structuredDataEl);
    }

    return () => {
      document.title = previousTitle;
      if (previousDescription !== null) {
        setMetaByName("description", previousDescription);
      }
      if (previousRobots !== null) {
        setMetaByName("robots", previousRobots);
      }
      if (previousCanonical !== null && canonicalEl) {
        canonicalEl.setAttribute("href", previousCanonical);
      }
      removeMetaByProperty("og:title");
      removeMetaByProperty("og:url");
      removeMetaByProperty("og:description");
      structuredDataEl?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, noindex, JSON.stringify(structuredData ?? null)]);
}
