import { useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, Check, Archive } from 'lucide-react';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon?: ReactNode;
    label: string;
    color?: string;
  };
  rightAction?: {
    icon?: ReactNode;
    label: string;
    color?: string;
  };
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = { icon: <Trash2 className="h-5 w-5" />, label: 'Delete', color: 'bg-destructive' },
  rightAction = { icon: <Check className="h-5 w-5" />, label: 'Complete', color: 'bg-green-500' },
  className,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const threshold = 100; // pixels to trigger action

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Limit swipe distance
    const maxSwipe = 150;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    setTranslateX(limitedDiff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (translateX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (translateX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setTranslateX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const diff = currentX - startX.current;
    
    const maxSwipe = 150;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    setTranslateX(limitedDiff);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleTouchEnd();
    }
  };

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {/* Left action (shown when swiping right) */}
      {onSwipeRight && (
        <div 
          className={cn(
            'absolute inset-y-0 left-0 flex items-center justify-start pl-4 text-white',
            rightAction.color
          )}
          style={{ 
            width: Math.max(0, translateX),
            opacity: Math.min(1, translateX / threshold)
          }}
        >
          <div className="flex items-center gap-2">
            {rightAction.icon}
            <span className="text-sm font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action (shown when swiping left) */}
      {onSwipeLeft && (
        <div 
          className={cn(
            'absolute inset-y-0 right-0 flex items-center justify-end pr-4 text-white',
            leftAction.color
          )}
          style={{ 
            width: Math.max(0, -translateX),
            opacity: Math.min(1, -translateX / threshold)
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{leftAction.label}</span>
            {leftAction.icon}
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        ref={cardRef}
        className={cn(
          'relative bg-card transition-transform duration-200 ease-out',
          isDragging && 'transition-none'
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </div>
  );
}
