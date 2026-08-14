import { Link, useNavigate } from "react-router-dom";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { formatCurrency } from "../../utils/currency";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../../utils/site-settings";

type Variant = "featured" | "compact" | "horizontal";

interface ProductCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  /** Lowest daily rate across active variants — "from ₹X/day". */
  fromDailyRate: number | null;
  available: boolean;
  variant?: Variant;
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-4 w-4">
      <path
        d="M4 20l1.4-4.2A8 8 0 1 1 9 18.6L4 20Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-4 w-4">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1L6.6 10.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductCard({
  id,
  name,
  imageUrl,
  fromDailyRate,
  available,
  variant = "featured",
}: ProductCardProps) {
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const phone = settings.status === "success" ? settings.data.phone : SITE_SETTINGS_DEFAULTS.phone;

  const priceTag = (
    <span className={`spec-tag ${available ? "spec-tag--accent" : ""}`}>
      {fromDailyRate != null
        ? `${formatCurrency(fromDailyRate)}/day`
        : "Rate on enquiry"}
    </span>
  );

  const priceLine = (
    <span className="font-body text-[13px] text-graphite-500">
      {fromDailyRate != null ? (
        <>
          <span className="font-semibold text-ink dark:text-ink-inverted">
            {formatCurrency(fromDailyRate)}
          </span>{" "}
          / day
        </>
      ) : (
        "Rate on enquiry"
      )}
    </span>
  );

  const enquireButton = (
    <Button
      variant="outline"
      size="sm"
      fullWidth
      className="!h-8 border-accent-400 text-[13px] text-accent-600 hover:bg-accent-50 dark:border-accent-500 dark:text-accent-400 dark:hover:bg-graphite-800"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/enquire?productId=${id}`);
      }}
    >
      <span className="text-accent-500">E</span>nquire
    </Button>
  );

  const image = (
    <span className="flex h-full w-full items-center justify-center overflow-hidden bg-graphite-100 dark:bg-graphite-800">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-display text-[13px] text-graphite-400">
          {name.charAt(0)}
        </span>
      )}
    </span>
  );

  if (variant === "horizontal") {
    return (
      <Link to={`/products/${id}`}>
        <Card interactive className="flex items-center gap-3 overflow-hidden p-2">
          <span className="h-16 w-16 flex-shrink-0 overflow-hidden rounded">
            {image}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
              {name}
            </span>
            {priceTag}
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === "compact") {
    // Unlike "featured"/"horizontal" (used in horizontally-scrolling strips, where a
    // fixed width is required), "compact" is only ever rendered inside a 2-column CSS
    // grid (Tools, Category, Search). A fixed w-32 + flex-shrink-0 here fought the grid
    // track width, so cards didn't stretch to fill their column and could end up
    // misaligned/overlapping. Let the grid column control the width instead.
    return (
      <Link to={`/products/${id}`} className="block w-full">
        <Card interactive className="flex flex-col overflow-hidden">
          <span className="aspect-square w-full">{image}</span>
          <div className="flex flex-col gap-1 p-2.5">
            <span className="line-clamp-2 font-body text-[13px] font-medium leading-snug text-ink dark:text-ink-inverted">
              {name}
            </span>
            {priceLine}

            <div className="mt-1.5 flex overflow-hidden rounded-md border border-graphite-200 dark:border-graphite-700">
              <button
                type="button"
                aria-label={`Enquire about ${name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/enquire?productId=${id}`);
                }}
                className="flex h-9 flex-1 items-center justify-center border-r border-graphite-200 text-graphite-600 hover:bg-graphite-50 dark:border-graphite-700 dark:text-graphite-300 dark:hover:bg-graphite-800"
              >
                <ChatIcon />
              </button>
              <a
                href={`tel:${phone}`}
                aria-label={`Call about ${name}`}
                onClick={(e) => e.stopPropagation()}
                className="flex h-9 flex-1 items-center justify-center text-graphite-600 hover:bg-graphite-50 dark:text-graphite-300 dark:hover:bg-graphite-800"
              >
                <PhoneIcon />
              </a>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // featured (default)
  return (
    <Link to={`/products/${id}`} className="w-40 flex-shrink-0">
      <Card interactive className="flex flex-col overflow-hidden rounded-xl">
        <span className="aspect-[4/3] w-full">{image}</span>
        <div className="flex flex-col gap-2 p-3">
          <span className="truncate font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
            {name}
          </span>
          <div className="flex items-center justify-between">
            {priceLine}
            {!available && <span className="font-body text-[11px] text-graphite-400">Unavailable</span>}
          </div>
          {enquireButton}
        </div>
      </Card>
    </Link>
  );
}
