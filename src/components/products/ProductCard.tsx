import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { formatCurrency } from "../../utils/currency";

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

export function ProductCard({
  id,
  name,
  imageUrl,
  fromDailyRate,
  available,
  variant = "featured",
}: ProductCardProps) {
  const priceTag = (
    <span className={`spec-tag ${available ? "spec-tag--accent" : ""}`}>
      {fromDailyRate != null
        ? `${formatCurrency(fromDailyRate)}/day`
        : "Rate on enquiry"}
    </span>
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
    return (
      <Link to={`/products/${id}`} className="w-32 flex-shrink-0">
        <Card interactive className="flex flex-col overflow-hidden">
          <span className="aspect-square w-full">{image}</span>
          <div className="flex flex-col gap-1 p-2">
            <span className="truncate font-body text-[13px] font-medium text-ink dark:text-ink-inverted">
              {name}
            </span>
            {priceTag}
          </div>
        </Card>
      </Link>
    );
  }

  // featured (default)
  return (
    <Link to={`/products/${id}`} className="w-40 flex-shrink-0">
      <Card interactive className="flex flex-col overflow-hidden">
        <span className="aspect-[4/3] w-full">{image}</span>
        <div className="flex flex-col gap-1.5 p-3">
          <span className="truncate font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
            {name}
          </span>
          <div className="flex items-center justify-between">
            {priceTag}
            {!available && <span className="font-body text-[11px] text-graphite-400">Unavailable</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
