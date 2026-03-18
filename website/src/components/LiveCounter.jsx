import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lightning, ArrowSquareOut } from '@phosphor-icons/react';
import { useInView } from '../hooks/useAnimations';

const BASE_KWP = 3000;
const DAILY_GROWTH_RATE = 2.5;
const START_DATE = new Date('2024-01-01T00:00:00');

function getCurrentKwp() {
  const now = new Date();
  const daysSinceStart = (now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(BASE_KWP + daysSinceStart * DAILY_GROWTH_RATE);
}

function useAnimatedCounter(targetValue, isInView, duration = 2000) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (targetValue - startValue) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInView, targetValue, duration]);

  return displayValue;
}

export default function LiveCounter() {
  const [ref, isInView] = useInView({ threshold: 0.3 });
  const [currentKwp, setCurrentKwp] = useState(getCurrentKwp);
  const displayValue = useAnimatedCounter(currentKwp, isInView);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentKwp(getCurrentKwp());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formattedValue = displayValue.toLocaleString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/15 group-hover:bg-white/15 group-hover:border-taqon-orange/30 transition-all duration-500 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-taqon-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <ArrowSquareOut size={16} className="absolute top-4 right-4 text-white/30 group-hover:text-taqon-orange transition-colors z-10" />

        <div className="relative z-10">
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Live</span>
          </div>

          {/* Counter Display */}
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <span className="text-3xl sm:text-5xl lg:text-6xl font-bold font-syne text-gradient tabular-nums">
              {formattedValue}
            </span>
            <span className="text-base sm:text-xl lg:text-2xl font-semibold text-white/40">kWp</span>
          </div>

          {/* Label */}
          <p className="mt-3 text-sm lg:text-base">
            <span className="text-taqon-orange underline decoration-taqon-orange/30 underline-offset-2 group-hover:decoration-taqon-orange transition-all">Total kWp Installed</span>
          </p>

          {/* Sub-info */}
          <div className="mt-6 flex items-center gap-2 text-taqon-orange/80">
            <Lightning size={16} />
            <span className="text-xs font-medium">Powering homes & businesses across <span className="underline decoration-taqon-orange/30 underline-offset-2">Zimbabwe</span></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
