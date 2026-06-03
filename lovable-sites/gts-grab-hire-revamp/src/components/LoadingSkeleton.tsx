import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  type: 'card' | 'text' | 'image' | 'form' | 'list';
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type, 
  count = 1, 
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`space-y-4 p-6 border rounded-lg ${className}`}>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        );
      
      case 'image':
        return <Skeleton className={`aspect-video rounded-lg ${className}`} />;
      
      case 'form':
        return (
          <div className={`space-y-4 ${className}`}>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        );
      
      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return <Skeleton className={className} />;
    }
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default LoadingSkeleton;