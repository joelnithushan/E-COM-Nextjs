'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  once?: boolean; // Only load once when visible
}

/**
 * LazyLoad Component
 * Uses Intersection Observer API to lazy load content
 * 
 * @example
 * <LazyLoad fallback={<Skeleton />}>
 *   <HeavyComponent />
 * </LazyLoad>
 */
const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback = null,
  rootMargin = '50px',
  threshold = 0.1,
  once = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            setHasLoaded(true);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [rootMargin, threshold, once]);

  // If once is true and we've already loaded, always show children
  if (once && hasLoaded) {
    return <>{children}</>;
  }

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
};

export default LazyLoad;



