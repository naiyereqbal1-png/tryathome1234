import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { db } from '../../services/db';

export const DEFAULT_HERO_SLIDES = [
  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&q=80',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80',
];

interface HeroCarouselProps {
  onSelectCategory?: (category: string) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onSelectCategory }) => {
  const [settings, setSettings] = useState(() => db.getSettings());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  // Touch tracking for mobile swipe support
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Sync with store settings updates
  useEffect(() => {
    const handleUpdate = () => {
      setSettings(db.getSettings());
      setFailedImages({});
    };

    window.addEventListener('style1_data_changed', handleUpdate);
    return () => {
      window.removeEventListener('style1_data_changed', handleUpdate);
    };
  }, []);

  // Compute active slides
  const activeSlides = useMemo(() => {
    const customSlides = settings.hero_slides || [];
    const enabledCustom = customSlides.filter(
      (s) => s.enabled && s.url && s.url.trim().length > 0
    );

    if (enabledCustom.length > 0) {
      return enabledCustom;
    }

    // Default Fallbacks
    const legacyImages = db.getHeroCarouselImages();
    return [
      {
        url: legacyImages[0] || DEFAULT_HERO_SLIDES[0],
        title: 'Festive Denim Edit',
        subtitle: 'Handcrafted Indigo Classics',
        buttonText: 'Shop Jeans',
        buttonLink: '#jeans',
        enabled: true,
      },
      {
        url: legacyImages[1] || DEFAULT_HERO_SLIDES[1],
        title: 'Artisan Streetwear',
        subtitle: '100% Combed Cotton Essentials',
        buttonText: 'Explore',
        buttonLink: '#streetwear',
        enabled: true,
      },
      {
        url: legacyImages[2] || DEFAULT_HERO_SLIDES[2],
        title: 'Heritage Looms',
        subtitle: 'Pure Linen & Chikankari Collection',
        buttonText: 'Shop Kurtis',
        buttonLink: '#kurtis',
        enabled: true,
      },
    ];
  }, [settings]);

  const totalSlides = activeSlides.length;

  const goToNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    if (totalSlides <= 1) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto sliding every 5 seconds (only if multiple slides exist)
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      goToNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, goToNext, totalSlides]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diff = touchStartXRef.current - touchEndXRef.current;
      if (diff > 45) {
        goToNext();
      } else if (diff < -45) {
        goToPrev();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];
  const isFailed = failedImages[currentIndex];
  const activeImage = !isFailed && currentSlide?.url ? currentSlide.url : DEFAULT_HERO_SLIDES[0];

  const slideVariants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 30 : -30,
      scale: 0.98,
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -30 : 30,
      scale: 0.98,
      transition: {
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div
      id="hero-3slide-carousel"
      className="relative w-full h-[320px] sm:h-[380px] md:h-[430px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/90 shadow-2xl group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Hero Image Carousel"
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={`slide-${currentIndex}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full"
        >
          <img
            id={`hero-slide-img-${currentIndex + 1}`}
            src={activeImage}
            alt={currentSlide?.title || 'Hero Slide'}
            className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => {
              setFailedImages((prev) => ({ ...prev, [currentIndex]: true }));
            }}
          />

          {/* Vignette Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent pointer-events-none" />

          {/* Floating Slide Details */}
          <div className="absolute bottom-6 left-6 right-16 sm:right-24 z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-amber-400 text-[11px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3" />
              <span>{currentSlide?.title || 'Exclusive Collection'}</span>
            </div>
            <p className="text-white text-base sm:text-lg md:text-xl font-bold tracking-wide drop-shadow-md line-clamp-2">
              {currentSlide?.subtitle}
            </p>
            {currentSlide?.buttonText && (
              <div className="pt-1">
                <a
                  href={currentSlide.buttonLink || '#'}
                  className="inline-block px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors theme-btn-primary"
                >
                  {currentSlide.buttonText}
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicator Dots - Only show if totalSlides > 1 */}
      {totalSlides > 1 && (
        <div
          id="hero-carousel-dots"
          className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5"
        >
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              id={`hero-dot-${idx + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? 'w-6 bg-amber-400 shadow-sm shadow-amber-400/50'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
