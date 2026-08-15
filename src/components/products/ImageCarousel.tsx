import { useRef, useState } from "react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  /** Grays out every photo and stamps a bold "Out of stock" badge over the carousel. */
  outOfStock?: boolean;
}

/**
 * Renders the product's cover photo plus any gallery photos (see
 * `product_images` / products.service.ts) as a swipeable, dot-indexed
 * carousel. A product with no gallery photos still works fine here — it
 * just renders as a single plain image with no dots.
 */
export function ImageCarousel({ images, alt, outOfStock = false }: ImageCarouselProps) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const outOfStockBadge = outOfStock && (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-graphite-950/45"
    >
      <span className="rotate-[-8deg] rounded bg-graphite-950/85 px-5 py-2 font-display text-[22px] font-bold uppercase tracking-wide text-white shadow-raised">
        Out of stock
      </span>
    </span>
  );

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center bg-graphite-100 dark:bg-graphite-800">
        <span className={["font-display text-[24px] text-graphite-500", outOfStock ? "grayscale" : ""].join(" ")}>
          {alt.charAt(0)}
        </span>
        {outOfStockBadge}
      </div>
    );
  }

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(images.length - 1, Math.max(0, index)));
  };

  const goTo = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActive(index);
  };

  return (
    <div
      className="relative"
      role="group"
      aria-roledescription="carousel"
      aria-label={images.length > 1 ? `${alt} photos` : alt}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className={[
          "flex aspect-square w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          outOfStock ? "grayscale" : "",
        ].join(" ")}
      >
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="flex h-full w-full flex-shrink-0 snap-center items-center justify-center bg-graphite-100 dark:bg-graphite-800"
          >
            <img
              src={src}
              // Every photo sharing one identical alt gives a screen-reader
              // user no indication there are multiple distinct images at
              // all — differentiate by position once there's more than one.
              alt={images.length > 1 ? `${alt} — photo ${index + 1} of ${images.length}` : alt}
              className="h-full w-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {outOfStockBadge}

      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Go to photo ${index + 1} of ${images.length}`}
              aria-current={index === active}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={[
                  "h-1.5 rounded-full transition-all duration-150 ease-app",
                  index === active ? "w-4 bg-accent-500" : "w-1.5 bg-white/70",
                ].join(" ")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
