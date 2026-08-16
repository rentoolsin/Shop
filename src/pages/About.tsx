import { CheckCircle, ChatCircle, Wrench } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { DesktopContainer } from "../components/layout/DesktopHeader";
import { Button } from "../components/ui/Button";
import { useCategories } from "../hooks/useCategories";
import { useProducts } from "../hooks/useProducts";
import { useHomepageContent } from "../hooks/useHomepageContent";
import { HOMEPAGE_SECTION_DEFAULTS } from "../utils/homepage-content";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded border border-graphite-200 bg-white px-3 py-3.5 text-center dark:border-graphite-800 dark:bg-graphite-900">
      <p className="font-display text-[18px] font-semibold text-ink dark:text-ink-inverted">{value}</p>
      <p className="mt-0.5 font-body text-[11px] leading-tight text-graphite-500">{label}</p>
    </div>
  );
}

export function About() {
  useDocumentMeta({
    title: "About",
    description: "About RenTools, a construction tool and equipment rental business in Coimbatore, Tamil Nadu.",
  });

  const navigate = useNavigate();
  const products = useProducts();
  const categories = useCategories();
  const homepage = useHomepageContent();
  const settings = useSiteSettings();

  // CMS/live data is best-effort everywhere in this app: render sensible
  // fallbacks while loading or on error rather than blocking the page.
  const cms = homepage.status === "success" ? homepage.data.content : HOMEPAGE_SECTION_DEFAULTS;
  const { address } = settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;
  const toolCount = products.status === "success" ? String(products.data.length) : "—";
  const categoryCount = categories.status === "success" ? String(categories.data.length) : "—";

  return (
    <div>
      {/* Mobile / narrow-viewport layout */}
      <div className="md:hidden">
      <PageHeader title="About" />

      <div className="space-y-6 p-4">
        {/* Hero */}
        <section className="relative overflow-hidden rounded bg-gradient-to-br from-graphite-950 to-graphite-800 px-5 py-7 dark:to-black">
          <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="relative">
            <span className="flex h-12 w-12 items-center justify-center rounded bg-accent-500 shadow-[0_4px_14px_-2px_rgba(240,168,27,0.5)]">
              <img src="/rentools-mark.png" alt="" className="h-7 w-7" />
            </span>
            <h1 className="mt-4 font-display text-[22px] font-semibold leading-tight text-white">
              Tools for the people who build Coimbatore
            </h1>
            <p className="mt-1.5 max-w-[36ch] font-body text-[13.5px] leading-relaxed text-graphite-400">
              RenTools is a construction tool &amp; equipment rental business based in{" "}
              {address}. We check every tool before it leaves the yard, keep pricing
              straightforward, and stay one call or WhatsApp message away.
            </p>
          </div>
        </section>

        {/* Live stats */}
        <section className="flex gap-3">
          <StatChip value={toolCount} label="Tools listed" />
          <StatChip value={categoryCount} label="Categories" />
          <StatChip value="Coimbatore" label="Based & operating in" />
        </section>

        {/* Why RenTools */}
        <section>
          <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.04em] text-graphite-500">
            Why RenTools
          </h2>
          <div className="mt-3 space-y-2.5 rounded border border-graphite-200 bg-white p-4 dark:border-graphite-800 dark:bg-graphite-900">
            {cms.why_rentools.points.map((point) => (
              <div key={point} className="flex items-start gap-2.5">
                <CheckCircle className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-accent-500" weight="regular" />
                <p className="font-body text-[14px] leading-snug text-ink dark:text-ink-inverted">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — vertical timeline */}
        <section>
          <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.04em] text-graphite-500">
            How it works
          </h2>
          <ol className="relative mt-3 space-y-5 pl-2">
            <div
              aria-hidden
              className="absolute bottom-4 left-[19px] top-4 w-px bg-graphite-200 dark:bg-graphite-800"
            />
            {cms.how_it_works.steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-3.5">
                <span className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-graphite-200 bg-graphite-25 font-mono text-[12.5px] font-semibold text-ink dark:border-graphite-700 dark:bg-graphite-950 dark:text-ink-inverted">
                  {index + 1}
                </span>
                <div className="pt-0.5">
                  <p className="font-body text-[14px] font-semibold text-ink dark:text-ink-inverted">
                    {step.title}
                  </p>
                  <p className="mt-0.5 font-body text-[13px] leading-snug text-graphite-500">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="rounded border border-graphite-200 bg-graphite-50 p-4 dark:border-graphite-800 dark:bg-graphite-900/50">
          <div className="flex items-start gap-2.5">
            <Wrench className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-500" weight="regular" />
            <div>
              <h2 className="font-display text-[14.5px] font-semibold text-ink dark:text-ink-inverted">
                Need a tool for your site?
              </h2>
              <p className="mt-0.5 font-body text-[13px] text-graphite-500">
                Browse what we have, or reach out directly and we'll sort out availability and rate.
              </p>
            </div>
          </div>
          <div className="mt-3.5 flex gap-2">
            <Button variant="accent" fullWidth onClick={() => navigate("/products")}>
              Browse tools
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => navigate("/contact")}
            >
              <span className="inline-flex items-center gap-1.5">
                <ChatCircle className="h-4 w-4" weight="regular" />
                Contact
              </span>
            </Button>
          </div>
        </section>
      </div>
      </div>

      {/* Desktop / wide-viewport layout */}
      <div className="hidden md:block">
        {/* Hero — full-bleed band, content pinned to the shared column */}
        <section className="relative overflow-hidden bg-gradient-to-br from-graphite-950 to-graphite-800 dark:to-black">
          <div className="pointer-events-none absolute -left-10 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
          <DesktopContainer className="relative flex items-center gap-14 py-16">
            <div className="max-w-[46ch]">
              <span className="flex h-14 w-14 items-center justify-center rounded bg-accent-500 shadow-[0_4px_14px_-2px_rgba(240,168,27,0.5)]">
                <img src="/rentools-mark.png" alt="" className="h-8 w-8" />
              </span>
              <h1 className="mt-5 font-display text-[38px] font-semibold leading-tight text-white">
                Tools for the people who build Coimbatore
              </h1>
              <p className="mt-3 font-body text-[15.5px] leading-relaxed text-graphite-400">
                RenTools is a construction tool &amp; equipment rental business based in {address}.
                We check every tool before it leaves the yard, keep pricing straightforward, and stay
                one call or WhatsApp message away.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="accent" size="lg" onClick={() => navigate("/products")}>
                  Browse tools
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate("/contact")}>
                  <span className="inline-flex items-center gap-1.5">
                    <ChatCircle className="h-4 w-4" weight="regular" />
                    Contact us
                  </span>
                </Button>
              </div>
            </div>

            {/* Stats stacked beside the hero copy on desktop, instead of
                a separate strip beneath it */}
            <div className="ml-auto grid w-[260px] flex-shrink-0 grid-cols-1 gap-4">
              <StatChip value={toolCount} label="Tools listed" />
              <StatChip value={categoryCount} label="Categories" />
              <StatChip value="Coimbatore" label="Based & operating in" />
            </div>
          </DesktopContainer>
        </section>

        <DesktopContainer className="py-14">
          <div className="grid grid-cols-2 gap-14">
            {/* Why RenTools */}
            <section>
              <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-graphite-500">
                Why RenTools
              </h2>
              <div className="mt-4 space-y-3.5 rounded-lg border border-graphite-200 bg-white p-6 dark:border-graphite-800 dark:bg-graphite-900">
                {cms.why_rentools.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-500"
                      weight="regular"
                    />
                    <p className="font-body text-[15px] leading-snug text-ink dark:text-ink-inverted">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* How it works */}
            <section>
              <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-graphite-500">
                How it works
              </h2>
              <ol className="relative mt-4 space-y-6 pl-2">
                <div
                  aria-hidden
                  className="absolute bottom-5 left-[19px] top-5 w-px bg-graphite-200 dark:bg-graphite-800"
                />
                {cms.how_it_works.steps.map((step, index) => (
                  <li key={step.title} className="relative flex gap-4">
                    <span className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-graphite-200 bg-graphite-25 font-mono text-[12.5px] font-semibold text-ink dark:border-graphite-700 dark:bg-graphite-950 dark:text-ink-inverted">
                      {index + 1}
                    </span>
                    <div className="pt-0.5">
                      <p className="font-body text-[15px] font-semibold text-ink dark:text-ink-inverted">
                        {step.title}
                      </p>
                      <p className="mt-1 font-body text-[13.5px] leading-relaxed text-graphite-500">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* CTA */}
          <section className="mt-14 flex items-center justify-between rounded-lg border border-graphite-200 bg-graphite-50 p-8 dark:border-graphite-800 dark:bg-graphite-900/50">
            <div className="flex items-start gap-3.5">
              <Wrench className="mt-0.5 h-6 w-6 flex-shrink-0 text-accent-500" weight="regular" />
              <div>
                <h2 className="font-display text-[18px] font-semibold text-ink dark:text-ink-inverted">
                  Need a tool for your site?
                </h2>
                <p className="mt-1 max-w-[48ch] font-body text-[14px] text-graphite-500">
                  Browse what we have, or reach out directly and we'll sort out availability and rate.
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-2.5">
              <Button variant="accent" size="lg" onClick={() => navigate("/products")}>
                Browse tools
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate("/contact")}>
                <span className="inline-flex items-center gap-1.5">
                  <ChatCircle className="h-4 w-4" weight="regular" />
                  Contact
                </span>
              </Button>
            </div>
          </section>
        </DesktopContainer>
      </div>
    </div>
  );
}
