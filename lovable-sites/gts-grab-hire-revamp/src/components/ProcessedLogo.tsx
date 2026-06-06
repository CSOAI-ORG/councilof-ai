import React, { useState, useEffect } from 'react';
import { removeBackground, loadImageFromUrl } from '@/utils/backgroundRemoval';
import gtsLogo from '@/assets/gts-logo-new.jpg';

interface ProcessedLogoProps {
  className?: string;
  height?: number;
  onProcessed?: (processedUrl: string) => void;
}

const ProcessedLogo: React.FC<ProcessedLogoProps> = ({ 
  className = "", 
  height = 60,
  onProcessed 
}) => {
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processLogo = async () => {
      try {
        setIsProcessing(true);
        setError(null);
        
        // Load the original image
        const imageElement = await loadImageFromUrl(gtsLogo);
        
        // Remove background
        const processedBlob = await removeBackground(imageElement);
        
        // Create URL for the processed image
        const processedUrl = URL.createObjectURL(processedBlob);
        setProcessedImageUrl(processedUrl);
        
        if (onProcessed) {
          onProcessed(processedUrl);
        }
      } catch (err) {
        console.error('Failed to process logo:', err);
        setError('Failed to process logo');
      } finally {
        setIsProcessing(false);
      }
    };

    processLogo();

    // Cleanup function to revoke object URL
    return () => {
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, []);

  if (error) {
    // Fallback to original logo if processing fails
    return (
      <div className={`flex items-center ${className}`}>
        <img 
          src={gtsLogo} 
          alt="GTS Grab Hire - Professional Grab Hire Services Kent London Essex" 
          className="h-auto object-contain hover:scale-105 transition-transform duration-200"
          style={{ height: `${height}px` }}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  if (isProcessing || !processedImageUrl) {
    // Show placeholder while processing
    return (
      <div className={`flex items-center ${className}`}>
        <div 
          className="bg-muted animate-pulse rounded"
          style={{ height: `${height}px`, width: `${height * 2}px` }}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={processedImageUrl} 
        alt="GTS Grab Hire - Professional Grab Hire Services Kent London Essex" 
        className="h-auto object-contain hover:scale-105 transition-transform duration-200"
        style={{ height: `${height}px` }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

export default ProcessedLogo;