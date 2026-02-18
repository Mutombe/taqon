import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../hooks/useAnimations';

const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
  },
};

export default function AnimatedSection({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.7,
  className = '',
  once = true,
  threshold = 0.1,
  ...props
}) {
  const [ref, isInView] = useInView({ threshold, repeat: !once });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants[variant] || variants.fadeUp}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Stagger children wrapper
export function StaggerContainer({ children, className = '', staggerDelay = 0.1, ...props }) {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '', variant = 'fadeUp', ...props }) {
  return (
    <motion.div
      variants={variants[variant] || variants.fadeUp}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Counter animation
export function AnimatedCounter({ value, suffix = '', duration = 2 }) {
  const [ref, isInView] = useInView();
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''));

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
    >
      {isInView ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {value}
        </motion.span>
      ) : (
        '0'
      )}
    </motion.span>
  );
}

// Magnetic button effect
export function MagneticButton({ children, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}
