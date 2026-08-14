import { useRef, useState } from "react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

/**
 * Renders the product's cover photo plus any gallery photos (see
 * `product_images` / products.service.ts) as a swipeable, dot-indexed
 * carousel. A product with no gallery photos still works fine here — it
 * just renders as a single plain image with no dots.
 */
export function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-graphite-100 dark:bg-graphite-800">
        <span className="font-display text-[24px] text-graphite-400">{alt.charAt(0)}</span>
      </div>
    );
  }

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(images.length - 1, Math.max(0, index)));
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex aspect-[4/3] w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="flex h-full w-full flex-shrink-0 snap-center items-center justify-center bg-graphite-100 dark:bg-graphite-800"
          >
            <img src={src} alt={alt} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
          {images.map((_, index) => (
            <span
              key={index}
              className={[
                "h-1.5 rounded-full transition-all duration-150 ease-app",
                index === active ? "w-4 bg-accent-500" : "w-1.5 bg-white/70",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
