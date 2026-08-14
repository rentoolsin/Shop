import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";

const LINKS = [
  { to: "/about", label: "About RenTools" },
  { to: "/contact", label: "Contact" },
  { to: "/location", label: "Location" },
];

export function More() {
  return (
    <div>
      <PageHeader title="More" />
      <ul className="divide-y divide-graphite-200 dark:divide-graphite-800">
        {LINKS.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="flex items-center justify-between px-4 py-4 font-body text-[15px] text-ink dark:text-ink-inverted"
            >
              {link.label}
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-4 w-4 text-graphite-400">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
