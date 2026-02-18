import React from 'react';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInView } from '../hooks/useAnimations';
import { reviews, averageRating, totalReviews } from '../data/reviewsData';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="flex-shrink-0 w-[320px] sm:w-[360px] bg-white dark:bg-taqon-charcoal rounded-2xl p-6 border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 dark:hover:border-taqon-orange/20 transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-taqon-orange">{review.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-taqon-charcoal dark:text-white text-sm truncate">{review.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} />
            <span className="text-xs text-taqon-muted dark:text-white/40">{review.date}</span>
          </div>
        </div>
      </div>

      {/* Review Text */}
      <p className="mt-4 text-sm text-taqon-muted dark:text-white/60 leading-relaxed line-clamp-4">
        {review.text}
      </p>

      {/* Helpful */}
      <div className="mt-4 flex items-center gap-1.5 text-xs text-taqon-muted dark:text-white/30">
        <ThumbsUp size={12} />
        <span>Helpful ({review.helpful})</span>
      </div>
    </div>
  );
}

export default function GoogleReviews() {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = 380;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Google Branding Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {/* Google "G" icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                Google Reviews
              </span>
            </div>

            {/* Average Rating */}
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
                {averageRating}
              </span>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={
                        star <= Math.floor(averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : star <= averageRating + 0.5
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
                <p className="text-xs text-taqon-muted dark:text-white/40 mt-0.5">
                  Based on {totalReviews} reviews
                </p>
              </div>
            </div>
          </div>

          {/* Scroll Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 flex items-center justify-center text-taqon-charcoal dark:text-white hover:border-taqon-orange/30 transition-colors"
              aria-label="Scroll reviews left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 flex items-center justify-center text-taqon-charcoal dark:text-white hover:border-taqon-orange/30 transition-colors"
              aria-label="Scroll reviews right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Reviews */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* View on Google Link */}
        <div className="mt-8 text-center">
          <a
            href="https://www.google.com/maps/place/Taqon+Electrico/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-taqon-orange hover:text-taqon-amber transition-colors"
          >
            View all reviews on Google
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </motion.section>
  );
}
