import { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'skeleton',
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority || isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isLoaded]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string) => {
    // Skip for external URLs or data URLs
    if (baseSrc.startsWith('http') || baseSrc.startsWith('data:')) {
      return undefined;
    }
    
    // For local images, we could generate different sizes
    // This is a placeholder - in production you'd want actual resized images
    return undefined;
  };

  const aspectRatio = width && height ? width / height : undefined;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
      }}
    >
      {/* Placeholder */}
      {placeholder === 'skeleton' && !isLoaded && !hasError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {placeholder === 'blur' && !isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-sm text-muted-foreground">Failed to load image</span>
        </div>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'low'}
          srcSet={generateSrcSet(src)}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
};

// Hook for preloading critical images
export const useImagePreload = (srcs: string[]) => {
  useEffect(() => {
    srcs.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [srcs]);
};

// Component for hero/above-fold images that should load immediately
export const PriorityImage = (props: Omit<OptimizedImageProps, 'priority'>) => (
  <OptimizedImage {...props} priority placeholder="none" />
);

// Component for below-fold images with lazy loading
export const LazyImage = (props: Omit<OptimizedImageProps, 'priority'>) => (
  <OptimizedImage {...props} priority={false} placeholder="skeleton" />
);

export default OptimizedImage;
