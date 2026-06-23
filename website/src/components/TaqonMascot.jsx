import React from 'react';
import { motion } from 'framer-motion';

/**
 * TaqonMascot — the Taqon Electrico brand robot, used to guide users through
 * the solar advisor. Fast-loading optimised WebP (front 45KB / side 27KB /
 * bust 21KB, transparent) with a subtle idle float and orange energy glow.
 *
 * Props:
 *   variant  'front' | 'side' | 'bust'   which render to show
 *   size     height in px (width auto from intrinsic aspect ratio)
 *   float    bool — idle bobbing animation (default true)
 *   glow     bool — soft orange halo behind the mascot (default true)
 *   message  string | string[] — optional speech bubble text (rotates if array)
 *   bubbleSide  'left' | 'right'  which side the bubble points from
 *   priority bool — eager-load (above the fold) instead of lazy
 */
const SRC = {
  front: { src: '/mascot/taqon-mascot-front.webp', w: 356, h: 760 },
  side: { src: '/mascot/taqon-mascot-side.webp', w: 318, h: 760 },
  bust: { src: '/mascot/taqon-mascot-bust.webp', w: 303, h: 320 },
};

function SpeechBubble({ messages, side }) {
  const list = Array.isArray(messages) ? messages : [messages];
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (list.length < 2) return undefined;
    const t = setInterval(() => setI((p) => (p + 1) % list.length), 4200);
    return () => clearInterval(t);
  }, [list.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.35, type: 'spring', stiffness: 240, damping: 20 }}
      className={`relative max-w-[15rem] rounded-2xl bg-white dark:bg-taqon-charcoal border border-taqon-orange/20 shadow-lg shadow-taqon-orange/10 px-4 py-3 ${
        side === 'right' ? 'rounded-br-sm' : 'rounded-bl-sm'
      }`}
    >
      <span className="absolute -top-2 left-4 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-taqon-orange animate-pulse" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-taqon-orange">Taqon</span>
      </span>
      <motion.p
        key={i}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[13px] leading-snug text-taqon-dark dark:text-white/90 font-medium mt-1"
      >
        {list[i]}
      </motion.p>
      {/* tail */}
      <span
        className={`absolute bottom-3 w-3 h-3 rotate-45 bg-white dark:bg-taqon-charcoal border-taqon-orange/20 ${
          side === 'right'
            ? '-right-1.5 border-t border-r'
            : '-left-1.5 border-b border-l'
        }`}
      />
    </motion.div>
  );
}

export default function TaqonMascot({
  variant = 'front',
  size = 280,
  float = true,
  glow = true,
  message = null,
  bubbleSide = 'left',
  priority = false,
  className = '',
}) {
  const m = SRC[variant] || SRC.front;
  const width = Math.round((size * m.w) / m.h);

  const Img = (
    <motion.div
      className="relative"
      animate={float ? { y: [0, -10, 0] } : undefined}
      transition={float ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
      style={{ width, height: size }}
    >
      {glow && (
        <motion.span
          aria-hidden
          className="absolute left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: width * 1.3,
            height: width * 1.3,
            background:
              'radial-gradient(circle, rgba(242,101,34,0.35) 0%, rgba(242,101,34,0.10) 45%, transparent 70%)',
            filter: 'blur(4px)',
          }}
          animate={{ opacity: [0.55, 0.9, 0.55], scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <img
        src={m.src}
        width={width}
        height={size}
        alt="Taqon, your solar advisor"
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        draggable={false}
        className="relative w-full h-full object-contain select-none"
        style={{ filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.28))' }}
      />
    </motion.div>
  );

  if (!message) {
    return <div className={`relative ${className}`}>{Img}</div>;
  }

  return (
    <div
      className={`relative flex items-end gap-3 ${
        bubbleSide === 'right' ? 'flex-row-reverse' : ''
      } ${className}`}
    >
      {Img}
      <div className="mb-6">
        <SpeechBubble messages={message} side={bubbleSide} />
      </div>
    </div>
  );
}
