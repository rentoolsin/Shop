import { ArrowRight, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileHeader } from "../components/layout/MobileHeader";
import { CategoryCard } from "../components/products/CategoryCard";
import { ProductCard } from "../components/products/ProductCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Button } from "../components/ui/Button";
import { SearchBar } from "../components/ui/SearchBar";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { LocationBar } from "../components/home/LocationBar";
import { ShopLocationCard } from "../components/home/ShopLocationCard";
import { TrustBar } from "../components/home/TrustBar";
import { HowItWorksSteps } from "../components/home/HowItWorksSteps";
import { CallButton } from "../components/actions/CallButton";
import { WhatsAppButton } from "../components/actions/WhatsAppButton";
import { useCategories } from "../hooks/useCategories";
import { useFeaturedProducts } from "../hooks/useProducts";
import { useHomepageContent } from "../hooks/useHomepageContent";
import { HOMEPAGE_SECTION_DEFAULTS } from "../utils/homepage-content";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

function SectionHeading({
  title,
  viewAllTo,
}: {
  title: string;
  /** Optional in-app path — renders a "View all ›" link on the right when set. */
  viewAllTo?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4">
      <h2 className="font-display text-[15px] font-semibold text-ink dark:text-ink-inverted">
        {title}
      </h2>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="inline-flex items-center gap-0.5 font-body text-[12.5px] font-medium text-graphite-500 hover:text-ink dark:hover:text-ink-inverted"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

// Echoes the reference design's accent-colored "site" callout inside the
// hero subheading, without hard-coding the copy — falls back to plain text
// if an admin edits the subheading to no longer contain the word.
function HighlightSite({ text }: { text: string }) {
  const match = text.match(/\bsite\b/i);
  if (!match || match.index === undefined) return <>{text}</>;
  const start = match.index;
  const end = start + match[0].length;
  return (
    <>
      {text.slice(0, start)}
      <span className="text-accent-500">{text.slice(start, end)}</span>
      {text.slice(end)}
    </>
  );
}

function HorizontalScroller({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const categories = useCategories();
  const featured = useFeaturedProducts();
  const homepage = useHomepageContent();
  const settings = useSiteSettings();

  // CMS overrides are best-effort: while loading or on error the page
  // renders the built-in defaults rather than blocking or showing an
  // error state for what is, functionally, homepage copy.
  const cms = homepage.status === "success" ? homepage.data.content : HOMEPAGE_SECTION_DEFAULTS;
  const hiddenSections = homepage.status === "success" ? homepage.data.hiddenSections : new Set();
  const { phone, whatsapp, latitude, longitude } =
    settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;

  useDocumentMeta({
    title: "RenTools",
    description:
      "Rent construction tools and equipment in Coimbatore. Browse tools, check daily rates, and enquire by call or WhatsApp.",
  });

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <div>
      <MobileHeader />

      {/* Hero */}
      {!hiddenSections.has("hero") && (
        <section className="pb-6 pt-4">
          <div className="px-4">
            <LocationBar />
          </div>

          {cms.hero.slides && cms.hero.slides.length > 0 && (
            <div className="mb-4 mt-4 px-4">
              <HeroCarousel slides={cms.hero.slides} />
            </div>
          )}

          <div className="mt-5 px-4">
            <h1 className="font-display text-[24px] font-extrabold leading-tight text-ink dark:text-ink-inverted">
              {cms.hero.heading}
            </h1>
            <p className="mt-2 font-body text-[14.5px] leading-snug text-graphite-500">
              <HighlightSite text={cms.hero.subheading} />
            </p>
          </div>

          <div className="px-4">
            <form onSubmit={handleSearchSubmit} className="mt-4">
              <label htmlFor="home-search" className="sr-only">
                Search tools
              </label>
              <SearchBar
                id="home-search"
                value={query}
                onChange={setQuery}
                placeholder="Search tools & equipment…"
                containerClassName="h-12"
                trailing={
                  <button
                    type="button"
                    onClick={() => navigate("/search")}
                    aria-label="Filters"
                    className="-mr-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-graphite-400 transition-colors active:bg-graphite-100 dark:active:bg-graphite-800"
                  >
                    <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                }
              />
            </form>

            <div className="mt-3 flex gap-2">
              <Button
                variant="accent"
                size="sm"
                fullWidth
                onClick={() => navigate("/products")}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  Browse tools
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => navigate("/request-purchase")}
              >
                Request purchase
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="mb-7">
        <SectionHeading title="Categories" viewAllTo="/products" />
        <div className="mt-3">
          {categories.status === "loading" && (
            <HorizontalScroller>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex w-24 flex-shrink-0 flex-col items-center gap-2">
                  <Skeleton className="h-16 w-16 rounded" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </HorizontalScroller>
          )}
          {categories.status === "error" && (
            <div className="px-4">
              <ErrorState
                title="Couldn't load categories"
                onRetry={categories.refetch}
              />
            </div>
          )}
          {categories.status === "success" && categories.data.length === 0 && (
            <div className="px-4">
              <EmptyState
                title="No categories yet"
                description="Categories will appear here once they're added in Admin."
              />
            </div>
          )}
          {categories.status === "success" && categories.data.length > 0 && (
            <HorizontalScroller>
              {categories.data.map((category) => (
                <CategoryCard key={category.id} {...category} />
              ))}
            </HorizontalScroller>
          )}
        </div>
      </section>

      {/* Featured tools */}
      <section className="mb-7">
        <SectionHeading title="Popular tools" viewAllTo="/products" />
        <div className="mt-3">
          {featured.status === "loading" && (
            <HorizontalScroller>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-40 flex-shrink-0">
                  <Skeleton className="aspect-square w-full rounded-t" />
                  <Skeleton className="mt-1 h-4 w-full" />
                </div>
              ))}
            </HorizontalScroller>
          )}
          {featured.status === "error" && (
            <div className="px-4">
              <ErrorState title="Couldn't load tools" onRetry={featured.refetch} />
            </div>
          )}
          {featured.status === "success" && featured.data.length === 0 && (
            <div className="px-4">
              <EmptyState
                title="No tools listed yet"
                description="Featured tools will show up here once they're added in Admin."
              />
            </div>
          )}
          {featured.status === "success" && featured.data.length > 0 && (
            <HorizontalScroller>
              {featured.data.map((product) => (
                <ProductCard key={product.id} {...product} variant="featured" />
              ))}
            </HorizontalScroller>
          )}
        </div>
      </section>

      {/* Why RenTools — shown as a compact trust/feature grid */}
      {!hiddenSections.has("why_rentools") && (
        <section className="mb-7">
          <SectionHeading title="Why RenTools" />
          <div className="mt-4 px-4">
            <TrustBar />
          </div>
        </section>
      )}

      {/* How it works */}
      {!hiddenSections.has("how_it_works") && (
        <section className="mb-7">
          <SectionHeading title="How it works" />
          <div className="mt-4 px-4">
            <HowItWorksSteps steps={cms.how_it_works.steps} />
          </div>
        </section>
      )}

      {/* Enquiry CTA */}
      <section className="mb-7 px-4">
        <div className="rounded border border-graphite-200 bg-white p-4 dark:border-graphite-800 dark:bg-graphite-900">
          <h2 className="font-display text-[15px] font-semibold text-ink dark:text-ink-inverted">
            Need a tool for your site?
          </h2>
          <p className="mt-1 font-body text-[13px] text-graphite-500">
            Send an enquiry and RenTools will get back to you with availability and rate.
          </p>
          <Button variant="accent" fullWidth className="mt-3" onClick={() => navigate("/enquire")}>
            Send enquiry
          </Button>
        </div>
      </section>

      {/* Contact / Location */}
      {!hiddenSections.has("contact_location") && (
        <section className="mb-4 px-4">
          <SectionHeading title="Contact & location" viewAllTo="/contact" />
          <div className="mt-3 space-y-3">
            <ShopLocationCard
              address={cms.contact_location.address}
              latitude={latitude}
              longitude={longitude}
            />
            <div className="flex gap-2">
              <CallButton phone={phone} fullWidth />
              <WhatsAppButton phone={whatsapp} fullWidth />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
