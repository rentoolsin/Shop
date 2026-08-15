import { Link } from "react-router-dom";

interface CategoryCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export function CategoryCard({ id, name, imageUrl }: CategoryCardProps) {
  return (
    <Link
      to={`/categories/${id}`}
      className={[
        "flex w-[104px] flex-shrink-0 flex-col items-center gap-2 rounded-xl border border-graphite-200",
        "bg-white px-2 py-3 text-center shadow-card transition-transform duration-150 ease-app active:scale-[0.98]",
        "dark:border-graphite-800 dark:bg-graphite-900",
      ].join(" ")}
    >
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-accent-50 dark:bg-graphite-800">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-[18px] font-semibold text-graphite-500">
            {name.charAt(0)}
          </span>
        )}
      </span>
      <span className="line-clamp-2 font-body text-[12px] font-semibold leading-tight text-ink dark:text-ink-inverted">
        {name}
      </span>
    </Link>
  );
}
