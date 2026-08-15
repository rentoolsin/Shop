import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { HeroSlide } from "../../utils/homepage-content";

const AUTOPLAY_MS = 4500;
const RESUME_AFTER_INTERACTION_MS = 6000;

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return direction === "left" ? (
    <ChevronLeft width={18} height={18} strokeWidth={1.8} />
  ) : (
    <ChevronRight width={18} height={18} strokeWidth={1.8} />
  );
}

/**
 * Full-bleed, swipeable hero image carousel. Slides are managed in
 * Admin → Homepage → Hero (see HomepageSectionForm.tsx) and stored as
 * plain URLs, same pattern as product/category images.
 *
 * Built on native CSS scroll-snap rather than a carousel library — it's
 * the lightest way to get correct touch/trackpad swipe physics, and it
 * degrades gracefully (still a scrollable strip) if JS autoplay never
 * runs. Current slide is tracked via IntersectionObserver rather than
 * scroll-position math so it stays correct regardless of container width.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    const el = slideRefs.current[index];
    if (!track || !el) return;
    // Scroll only the carousel's own track, not any ancestor. `Element.scrollIntoView`
    // (even with `block: "nearest"`) can walk up the DOM and adjust *any* scrollable
    // ancestor — including the page/window — to bring the target into view. On the
    // home page that meant every autoplay tick (or arrow/dot tap) could yank the whole
    // page's vertical scroll position back to the hero, moving everything below it.
    // Scrolling the track directly via its own scroll container avoids that entirely.
    track.scrollTo({ left: el.offsetLeft, behavior: "smooth" });
  }, []);

  // Track which slide is centered using IntersectionObserver — robust to
  // resize, zoom, and RTL, unlike computing index from scrollLeft.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = slideRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1) setActiveIndex(index);
          }
        }
      },
      { root: track, threshold: [0.6] },
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [slides.length]);

  // Autoplay — paused while the user is actively interacting (touch/drag/
  // pointer down on a dot or arrow), and off entirely for reduced motion.
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const next = (activeIndex + 1) % slides.length;
      scrollToIndex(next);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [activeIndex, paused, slides.length, scrollToIndex]);

  const pauseThenResume = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setPaused(false), RESUME_AFTER_INTERACTION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const goTo = (index: number) => {
    pauseThenResume();
    scrollToIndex((index + slides.length) % slides.length);
  };

  if (slides.length === 0) return null;

  return (
    <div
      className="group relative select-none"
      onPointerDown={pauseThenResume}
      onTouchStart={pauseThenResume}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto rounded [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => {
          const content = (
            <>
              <img
                src={slide.imageUrl}
                alt={slide.alt}
                className="h-full w-full object-cover"
                draggable={false}
                loading={index === 0 ? "eager" : "lazy"}
              />
              {slide.caption && (
                <span className="absolute bottom-3 left-3 max-w-[80%] rounded bg-graphite-950/70 px-2.5 py-1.5 font-body text-[13px] font-medium leading-snug text-white backdrop-blur-0">
                  {slide.caption}
                </span>
              )}
            </>
          );
          return (
            <div
              key={slide.id}
              ref={(el) => (slideRefs.current[index] = el)}
              className="relative aspect-[16/10] w-full flex-shrink-0 snap-start overflow-hidden bg-graphite-100 dark:bg-graphite-900"
            >
              {slide.linkTo ? (
                <button
                  type="button"
                  className="block h-full w-full text-left"
                  onClick={() => navigate(slide.linkTo!)}
                  aria-label={slide.alt || "View more"}
                >
                  {content}
                </button>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-graphite-950/60 text-white transition-opacity duration-150 ease-app hover:bg-graphite-950/80 sm:group-hover:flex"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-graphite-950/60 text-white transition-opacity duration-150 ease-app hover:bg-graphite-950/80 sm:group-hover:flex"
          >
            <ChevronIcon direction="right" />
          </button>

          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => goTo(index)}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className={[
                    "h-1.5 rounded-full transition-all duration-200 ease-app",
                    index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/50",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
