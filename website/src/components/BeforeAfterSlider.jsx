import React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
}) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const updatePosition = useCallback((clientX) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setPosition(percent);
  }, []);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  }, [isDragging, updatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    updatePosition(e.touches[0].clientX);
  }, [updatePosition]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    updatePosition(e.touches[0].clientX);
  }, [isDragging, updatePosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-col-resize select-none bg-taqon-charcoal"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* After Image (full background) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        draggable="false"
      />

      {/* Before Image (clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          draggable="false"
        />
      </div>

      {/* Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center">
          <div className="flex items-center gap-0.5">
            <svg width="6" height="14" viewBox="0 0 6 14" fill="none">
              <path d="M5 1L1 7L5 13" stroke="#F26522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg width="6" height="14" viewBox="0 0 6 14" fill="none">
              <path d="M1 1L5 7L1 13" stroke="#F26522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Before Label */}
      <div
        className="absolute top-4 left-4 z-10 transition-opacity duration-200"
        style={{ opacity: position > 15 ? 1 : 0 }}
      >
        <span className="bg-taqon-dark/70 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10">
          {beforeLabel}
        </span>
      </div>

      {/* After Label */}
      <div
        className="absolute top-4 right-4 z-10 transition-opacity duration-200"
        style={{ opacity: position < 85 ? 1 : 0 }}
      >
        <span className="bg-taqon-orange/80 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border border-taqon-orange/30">
          {afterLabel}
        </span>
      </div>
    </div>
  );
}
