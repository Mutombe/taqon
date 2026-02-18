import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

// Intersection Observer hook for scroll animations
export function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (!options.repeat) observer.unobserve(element);
        } else if (options.repeat) {
          setIsInView(false);
        }
      },
      { threshold: options.threshold || 0.1, rootMargin: options.rootMargin || '0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, options.repeat]);

  return [ref, isInView];
}

// Scroll progress hook
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

// Parallax hook
export function useParallax(speed = 0.5) {
  const [offset, setOffset] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      setOffset(scrolled * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return [ref, offset];
}

// Search hook
export function useSearch(data, keys) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = useCallback((searchQuery) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const lower = searchQuery.toLowerCase();
    const filtered = data.filter(item =>
      keys.some(key => {
        const value = key.split('.').reduce((obj, k) => obj?.[k], item);
        return String(value).toLowerCase().includes(lower);
      })
    );
    setResults(filtered);
  }, [data, keys]);

  return { query, results, search };
}

// Window size hook
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
