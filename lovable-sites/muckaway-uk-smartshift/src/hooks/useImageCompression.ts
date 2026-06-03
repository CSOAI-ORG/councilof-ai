import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.1, // 100KB - optimized for 2G networks
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  quality: 0.7,
};

export const useImageCompression = (options: CompressionOptions = {}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compressImage = useCallback(async (file: File): Promise<CompressionResult | null> => {
    if (!file.type.startsWith('image/')) {
      setError('File is not an image');
      return null;
    }

    setIsCompressing(true);
    setError(null);

    try {
      const compressionOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
      };

      const compressedFile = await imageCompression(file, compressionOptions);

      const result: CompressionResult = {
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: Math.round((1 - compressedFile.size / file.size) * 100),
      };

      console.log(`Image compressed: ${formatBytes(file.size)} → ${formatBytes(compressedFile.size)} (${result.compressionRatio}% reduction)`);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compress image';
      setError(message);
      console.error('Image compression error:', err);
      return null;
    } finally {
      setIsCompressing(false);
    }
  }, [options]);

  const compressImages = useCallback(async (files: File[]): Promise<CompressionResult[]> => {
    const results: CompressionResult[] = [];
    
    for (const file of files) {
      const result = await compressImage(file);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }, [compressImage]);

  const compressAndConvertToBase64 = useCallback(async (file: File): Promise<string | null> => {
    const result = await compressImage(file);
    if (!result) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(result.compressedFile);
    });
  }, [compressImage]);

  return {
    compressImage,
    compressImages,
    compressAndConvertToBase64,
    isCompressing,
    error,
  };
};

// Helper function to format bytes
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export default useImageCompression;
