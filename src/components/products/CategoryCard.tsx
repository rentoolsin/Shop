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
        "flex w-[104px] flex-shrink-0 flex-col overflow-hidden rounded-xl bg-graphite-100/70",
        "shadow-card transition-transform duration-150 ease-app active:scale-[0.98]",
        "dark:bg-graphite-900",
      ].join(" ")}
    >
      <span className="flex aspect-square w-full items-center justify-center overflow-hidden bg-white p-2.5 dark:bg-graphite-800/50">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="font-display text-[20px] font-semibold text-graphite-400">
            {name.charAt(0)}
          </span>
        )}
      </span>
      <span className="line-clamp-2 px-1.5 pb-3 pt-2 text-center font-body text-[12.5px] font-bold leading-tight text-ink dark:text-ink-inverted">
        {name}
      </span>
    </Link>
  );
}
