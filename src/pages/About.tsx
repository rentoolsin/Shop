import { PageHeader } from "../components/layout/PageHeader";

export function About() {
  return (
    <div>
      <PageHeader title="About" />
      <div className="space-y-3 p-4">
        <p className="font-body text-[14px] text-graphite-600 dark:text-graphite-300">
          RenTools is a construction tools and equipment rental business based in
          Kovilmedu, Coimbatore, Tamil Nadu.
        </p>
        <p className="font-body text-[14px] text-graphite-600 dark:text-graphite-300">
          {/* TODO: replace with real About copy from Admin → Website once CMS is wired up. */}
          More about RenTools will appear here.
        </p>
      </div>
    </div>
  );
}
