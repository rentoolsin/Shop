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
import { TrustBar } from "../components/home/TrustBar";
import { CallButton } from "../components/actions/CallButton";
import { WhatsAppButton } from "../components/actions/WhatsAppButton";
import { FloatingWhatsApp } from "../components/actions/FloatingWhatsApp";
import { useCategories } from "../hooks/useCategories";
import { useFeaturedProducts } from "../hooks/useProducts";
import { useHomepageContent } from "../hooks/useHomepageContent";
import { HOMEPAGE_SECTION_DEFAULTS } from "../utils/homepage-content";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";

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
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} className="h-3.5 w-3.5">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
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
  const { phone, whatsapp } =
    settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <div>
      <MobileHeader contextLabel="Coimbatore" />

      {/* Hero */}
      {!hiddenSections.has("hero") && (
        <section className="pb-6 pt-5">
          {cms.hero.slides && cms.hero.slides.length > 0 && (
            <div className="mb-4 px-4">
              <HeroCarousel slides={cms.hero.slides} />
            </div>
          )}

          <div className="px-4">
            <h1 className="font-display text-[24px] font-extrabold leading-tight text-ink dark:text-ink-inverted">
              {cms.hero.heading}
            </h1>
            <p className="mt-2 font-body text-[14px] text-graphite-500">{cms.hero.subheading}</p>

            <form onSubmit={handleSearchSubmit} className="mt-4">
              <label htmlFor="home-search" className="sr-only">
                Search tools
              </label>
              <SearchBar
                id="home-search"
                value={query}
                onChange={setQuery}
                placeholder="Search ladders, cutters, motors…"
                containerClassName="h-12 rounded-full"
              />
            </form>

            <div className="mt-3 flex gap-2">
              <Button
                variant="accent"
                onClick={() => navigate("/enquire")}
                className="flex-1 rounded-full"
              >
                <span className="inline-flex items-center gap-1.5">
                  Enquire now
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} className="h-4 w-4">
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Button>
              <CallButton phone={phone} label="Call" className="rounded-full" />
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
                  <Skeleton className="h-16 w-16 rounded-lg" />
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
                  <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
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

      {/* Why RenTools — shown as a compact trust/feature bar */}
      {!hiddenSections.has("why_rentools") && (
        <section className="mb-7 px-4">
          <TrustBar />
        </section>
      )}

      {/* How it works */}
      {!hiddenSections.has("how_it_works") && (
        <section className="mb-7 px-4">
          <SectionHeading title="How it works" />
          <ol className="mt-3 space-y-3">
            {cms.how_it_works.steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="spec-tag h-6 w-6 flex-shrink-0 items-center justify-center p-0 font-mono text-[12px]">
                  {index + 1}
                </span>
                <div>
                  <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                    {step.title}
                  </p>
                  <p className="font-body text-[13px] text-graphite-500">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Enquiry CTA */}
      <section className="mb-7 px-4">
        <div className="rounded-lg border border-graphite-200 bg-white p-4 dark:border-graphite-800 dark:bg-graphite-900">
          <h2 className="font-display text-[15px] font-semibold text-ink dark:text-ink-inverted">
            Need a tool for your site?
          </h2>
          <p className="mt-1 font-body text-[13px] text-graphite-500">
            Send an enquiry and RenTools will get back to you with availability and rate.
          </p>
          <Button fullWidth className="mt-3" onClick={() => navigate("/enquire")}>
            Send enquiry
          </Button>
        </div>
      </section>

      {/* Contact / Location */}
      {!hiddenSections.has("contact_location") && (
        <section className="mb-4 px-4">
          <SectionHeading title="Contact & location" />
          <div className="mt-3 rounded-lg border border-graphite-200 bg-white p-4 dark:border-graphite-800 dark:bg-graphite-900">
            <p className="font-body text-[14px] text-ink dark:text-ink-inverted">
              {cms.contact_location.address}
            </p>
            <div className="mt-3 flex gap-2">
              <CallButton phone={phone} fullWidth />
              <WhatsAppButton phone={whatsapp} fullWidth />
            </div>
          </div>
        </section>
      )}

      <FloatingWhatsApp phone={whatsapp} />
    </div>
  );
}
