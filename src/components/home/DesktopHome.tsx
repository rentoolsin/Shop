import {
  ArrowRight,
  CaretRight,
  CurrencyInr,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
} from "@phosphor-icons/react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CategoryCard } from "../products/CategoryCard";
import { ProductCard } from "../products/ProductCard";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { Button } from "../ui/Button";
import { SearchBar } from "../ui/SearchBar";
import { CallButton } from "../actions/CallButton";
import { WhatsAppButton } from "../actions/WhatsAppButton";
import { HeroCarousel } from "./HeroCarousel";
import { ShopLocationCard } from "./ShopLocationCard";
import { HowItWorksSteps } from "./HowItWorksSteps";
import { DesktopContainer as Container } from "../layout/DesktopHeader";
import type { CategoryListItem } from "../../services/categories.service";
import type { ProductListItem } from "../../services/products.service";
import type { HomepageSectionContentMap } from "../../utils/homepage-content";

type AsyncState<T> = (
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: unknown }
) & { refetch: () => void };

interface DesktopHomeProps {
  categories: AsyncState<CategoryListItem[]>;
  featured: AsyncState<ProductListItem[]>;
  cms: HomepageSectionContentMap;
  hiddenSections: { has(key: string): boolean };
  phone: string;
  whatsapp: string;
  latitude: number;
  longitude: number;
  query: string;
  setQuery: (value: string) => void;
  onSearchSubmit: (e: FormEvent) => void;
}

const iconProps = { className: "h-5 w-5 text-white", weight: "regular" } as const;

const TRUST_ITEMS: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <ShieldCheck {...iconProps} />, title: "Checked Equipment", body: "Quality checked before every rental" },
  { icon: <CurrencyInr {...iconProps} />, title: "Transparent Pricing", body: "No hidden charges, what you see is what you pay" },
  { icon: <Phone {...iconProps} />, title: "Direct Support", body: "Call or WhatsApp, we're here to help" },
  { icon: <MapPin {...iconProps} />, title: "Local Availability", body: "Quick delivery or pickup from nearby" },
];

// Same section-heading pattern as the mobile page (title + optional "View
// all" link), just sized up for a desktop container instead of a px-4 strip.
function SectionHeading({ title, viewAllTo }: { title: string; viewAllTo?: string }) {
  return (
    <div className="flex items-end justify-between">
      <h2 className="font-display text-[26px] font-extrabold leading-tight text-ink dark:text-ink-inverted">
        {title}
      </h2>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="inline-flex items-center gap-1 font-body text-[14px] font-medium text-graphite-500 transition-colors hover:text-accent-600 dark:hover:text-accent-400"
        >
          View all
          <CaretRight className="h-4 w-4" weight="regular" />
        </Link>
      )}
    </div>
  );
}

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

/**
 * Desktop homepage — a distinct layout tree from the mobile `Home` page
 * (see `pages/Home.tsx`), not a breakpoint-tweaked version of it. Reuses
 * the same data (categories/featured/cms/site settings) and the same
 * shared building-block components (CategoryCard, ProductCard, Button,
 * HeroCarousel, HowItWorksSteps, etc.) so content and behavior stay in
 * sync with mobile, but arranges them in a wide multi-column layout with
 * its own header instead of `MobileHeader`/`BottomNavigation`.
 */
export function DesktopHome({
  categories,
  featured,
  cms,
  hiddenSections,
  phone,
  whatsapp,
  latitude,
  longitude,
  query,
  setQuery,
  onSearchSubmit,
}: DesktopHomeProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-graphite-25 dark:bg-graphite-950">
      {/* Hero — the persistent top nav/search/cart bar lives in
          `DesktopHeader` (rendered once in App.tsx, shared by every
          route); this section is Home's own hero content below it. */}
      {!hiddenSections.has("hero") && (
        <section className="border-b border-graphite-200 py-14 dark:border-graphite-800">
          <Container className="grid grid-cols-2 items-center gap-16">
            <div>
              <h1 className="font-display text-[44px] font-extrabold leading-[1.05] text-ink dark:text-ink-inverted">
                {cms.hero.heading}
              </h1>
              <p className="mt-4 max-w-[46ch] font-body text-[17px] leading-relaxed text-graphite-500">
                <HighlightSite text={cms.hero.subheading} />
              </p>

              <form onSubmit={onSearchSubmit} className="mt-8 max-w-[440px]">
                <label htmlFor="home-search-hero" className="sr-only">
                  Search tools
                </label>
                <SearchBar
                  id="home-search-hero"
                  value={query}
                  onChange={setQuery}
                  placeholder="Search tools & equipment…"
                  containerClassName="h-[52px] w-full"
                />
              </form>

              <div className="mt-5 flex gap-3">
                <Button variant="accent" size="lg" onClick={() => navigate("/products")}>
                  <span className="inline-flex items-center justify-center gap-1.5">
                    Browse tools
                    <ArrowRight className="h-4 w-4" weight="regular" />
                  </span>
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/request-purchase")}>
                  Request a tool
                </Button>
              </div>
            </div>

            <div>
              {cms.hero.slides && cms.hero.slides.length > 0 ? (
                <div className="overflow-hidden rounded-lg shadow-card">
                  <HeroCarousel slides={cms.hero.slides} />
                </div>
              ) : (
                <div className="flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-graphite-100 dark:bg-graphite-900">
                  <Package className="h-16 w-16 text-graphite-300 dark:text-graphite-700" weight="light" />
                </div>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* Categories */}
      <section className="py-12">
        <Container>
          <SectionHeading title="Categories" viewAllTo="/products" />
          <div className="mt-6">
            {categories.status === "loading" && (
              <div className="flex flex-wrap gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex w-[104px] flex-col items-center gap-2">
                    <Skeleton className="h-16 w-16 rounded" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                ))}
              </div>
            )}
            {categories.status === "error" && (
              <ErrorState title="Couldn't load categories" onRetry={categories.refetch} />
            )}
            {categories.status === "success" && categories.data.length === 0 && (
              <EmptyState
                title="No categories yet"
                description="Categories will appear here once they're added in Admin."
              />
            )}
            {categories.status === "success" && categories.data.length > 0 && (
              <div className="flex flex-wrap gap-5">
                {categories.data.map((category) => (
                  <CategoryCard key={category.id} {...category} />
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Featured tools */}
      <section className="py-12">
        <Container>
          <SectionHeading title="Popular tools" viewAllTo="/products" />
          <div className="mt-6">
            {featured.status === "loading" && (
              <div className="grid grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-square w-full rounded-t" />
                    <Skeleton className="mt-1 h-4 w-full" />
                  </div>
                ))}
              </div>
            )}
            {featured.status === "error" && (
              <ErrorState title="Couldn't load tools" onRetry={featured.refetch} />
            )}
            {featured.status === "success" && featured.data.length === 0 && (
              <EmptyState
                title="No tools listed yet"
                description="Featured tools will show up here once they're added in Admin."
              />
            )}
            {featured.status === "success" && featured.data.length > 0 && (
              <div className="grid grid-cols-4 gap-5">
                {featured.data.map((product) => (
                  <ProductCard key={product.id} {...product} variant="compact" />
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Request a tool */}
      <section className="py-4">
        <Container>
          <div className="flex items-center gap-10 rounded-lg border border-graphite-200 bg-white p-10 dark:border-graphite-800 dark:bg-graphite-900">
            <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400">
              <Package className="h-8 w-8" weight="regular" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[20px] font-semibold text-ink dark:text-ink-inverted">
                Don&apos;t see the tool you need?
              </h2>
              <p className="mt-1.5 max-w-[70ch] font-body text-[14.5px] leading-relaxed text-graphite-500">
                Not everything RenTools stocks is listed online yet. Tell us what you&apos;re looking for
                — the tool, quantity, and when you need it — and we&apos;ll reach out to confirm
                availability and rate. No charge until you confirm.
              </p>
            </div>
            <Button variant="accent" size="lg" className="flex-shrink-0" onClick={() => navigate("/request-purchase")}>
              Request a tool
            </Button>
          </div>
        </Container>
      </section>

      {/* Why RenTools */}
      {!hiddenSections.has("why_rentools") && (
        <section className="py-12">
          <Container>
            <SectionHeading title="Why RenTools" />
            <div className="mt-8 grid grid-cols-4 gap-8">
              {TRUST_ITEMS.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent-500">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-[15px] font-bold leading-tight text-ink dark:text-ink-inverted">
                      {item.title}
                    </p>
                    <p className="mt-1 font-body text-[13px] leading-snug text-graphite-500">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* How it works */}
      {!hiddenSections.has("how_it_works") && (
        <section className="py-12">
          <Container>
            <SectionHeading title="How it works" />
            <div className="mt-10 max-w-[900px]">
              <HowItWorksSteps steps={cms.how_it_works.steps} />
            </div>
          </Container>
        </section>
      )}

      {/* Enquiry CTA */}
      <section className="py-4">
        <Container>
          <div className="flex items-center justify-between gap-8 rounded-lg border border-graphite-200 bg-white p-10 dark:border-graphite-800 dark:bg-graphite-900">
            <div>
              <h2 className="font-display text-[20px] font-semibold text-ink dark:text-ink-inverted">
                Need a tool for your site?
              </h2>
              <p className="mt-1.5 font-body text-[14.5px] text-graphite-500">
                Send an enquiry and RenTools will get back to you with availability and rate.
              </p>
            </div>
            <Button variant="accent" size="lg" className="flex-shrink-0" onClick={() => navigate("/enquire")}>
              Send enquiry
            </Button>
          </div>
        </Container>
      </section>

      {/* Contact / Location */}
      {!hiddenSections.has("contact_location") && (
        <section className="py-12">
          <Container>
            <SectionHeading title="Contact & location" viewAllTo="/contact" />
            <div className="mt-6 grid grid-cols-[1.4fr_1fr] gap-6">
              <ShopLocationCard
                address={cms.contact_location.address}
                latitude={latitude}
                longitude={longitude}
                className="h-full"
              />
              <div className="flex flex-col gap-2.5">
                <CallButton phone={phone} fullWidth />
                <WhatsAppButton phone={whatsapp} fullWidth />
              </div>
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}
