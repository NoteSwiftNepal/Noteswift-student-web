"use client";

import { useEffect, useRef, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { usePromoBanners } from "@/hooks/queries/usePromoBanners";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const AUTOPLAY_INTERVAL_MS = 5000;

// Real auto-advancing carousel — mobile's PromoCarousel is swipe-only/static
// (no autoplay), a genuine web adaptation since a home-page banner strip is
// expected to advance on its own on the web. Built on the embla instance
// this project already uses (embla-carousel-react is already a dependency,
// via the shadcn Carousel wrapper) with a plain setInterval, rather than
// pulling in embla-carousel-autoplay as a new dependency for one effect.
export function PromoCarousel() {
  const { banners, isLoading, isError } = usePromoBanners();
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!api || banners.length <= 1) return;
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      api.scrollNext();
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [api, banners.length]);

  if (isLoading) {
    return <Skeleton className="aspect-[1280/420] w-full rounded-xl" />;
  }

  if (isError || banners.length === 0) {
    return null;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Carousel opts={{ loop: true }} setApi={setApi} className="w-full">
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner._id || banner.id}>
              <div className="relative aspect-[1280/420] w-full overflow-hidden rounded-xl bg-secondary/40">
                {/* Banner images can come from any admin-configured host, so this
                    intentionally skips next/image's domain allowlist. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4">
                  {banner.badge && (
                    <span className="mb-1 w-fit rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {banner.badge}
                    </span>
                  )}
                  <p className="text-sm font-bold text-white sm:text-base">{banner.title}</p>
                  {banner.subtitle && (
                    <p className="text-xs text-white/80 sm:text-sm">{banner.subtitle}</p>
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {banners.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>

      {banners.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {banners.map((banner, i) => (
            <button
              key={banner._id || banner.id}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selectedIndex ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
