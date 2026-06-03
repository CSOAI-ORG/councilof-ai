/**
 * Visual Diff Comparison Engine
 * Compares two images and generates a diff overlay
 */

export interface DiffResult {
  diffPercentage: number;
  diffImageData: string | null;
  totalPixels: number;
  changedPixels: number;
  passed: boolean;
}

/**
 * Compare two base64 encoded images and return diff statistics
 */
export async function compareImages(
  baselineData: string,
  currentData: string,
  threshold: number = 0.1
): Promise<DiffResult> {
  return new Promise((resolve) => {
    const baselineImg = new Image();
    const currentImg = new Image();
    
    let loadedCount = 0;
    
    const onLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        const result = performComparison(baselineImg, currentImg, threshold);
        resolve(result);
      }
    };
    
    const onError = () => {
      resolve({
        diffPercentage: 100,
        diffImageData: null,
        totalPixels: 0,
        changedPixels: 0,
        passed: false,
      });
    };
    
    baselineImg.onload = onLoad;
    currentImg.onload = onLoad;
    baselineImg.onerror = onError;
    currentImg.onerror = onError;
    
    baselineImg.src = baselineData;
    currentImg.src = currentData;
  });
}

function performComparison(
  baseline: HTMLImageElement,
  current: HTMLImageElement,
  threshold: number
): DiffResult {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  
  // Create canvases for comparison
  const baselineCanvas = document.createElement('canvas');
  const currentCanvas = document.createElement('canvas');
  const diffCanvas = document.createElement('canvas');
  
  baselineCanvas.width = width;
  baselineCanvas.height = height;
  currentCanvas.width = width;
  currentCanvas.height = height;
  diffCanvas.width = width;
  diffCanvas.height = height;
  
  const baselineCtx = baselineCanvas.getContext('2d')!;
  const currentCtx = currentCanvas.getContext('2d')!;
  const diffCtx = diffCanvas.getContext('2d')!;
  
  // Draw images
  baselineCtx.drawImage(baseline, 0, 0);
  currentCtx.drawImage(current, 0, 0);
  
  // Get image data
  const baselineData = baselineCtx.getImageData(0, 0, width, height);
  const currentData = currentCtx.getImageData(0, 0, width, height);
  const diffData = diffCtx.createImageData(width, height);
  
  let changedPixels = 0;
  const totalPixels = width * height;
  
  // Compare pixels
  for (let i = 0; i < baselineData.data.length; i += 4) {
    const rDiff = Math.abs(baselineData.data[i] - currentData.data[i]);
    const gDiff = Math.abs(baselineData.data[i + 1] - currentData.data[i + 1]);
    const bDiff = Math.abs(baselineData.data[i + 2] - currentData.data[i + 2]);
    
    // Color difference threshold (0-255 per channel)
    const colorThreshold = 10;
    const isDifferent = rDiff > colorThreshold || gDiff > colorThreshold || bDiff > colorThreshold;
    
    if (isDifferent) {
      changedPixels++;
      // Highlight differences in red
      diffData.data[i] = 255;     // R
      diffData.data[i + 1] = 0;   // G
      diffData.data[i + 2] = 0;   // B
      diffData.data[i + 3] = 200; // A
    } else {
      // Show original with reduced opacity
      diffData.data[i] = currentData.data[i];
      diffData.data[i + 1] = currentData.data[i + 1];
      diffData.data[i + 2] = currentData.data[i + 2];
      diffData.data[i + 3] = 100; // Reduced opacity
    }
  }
  
  // Draw diff
  diffCtx.putImageData(diffData, 0, 0);
  
  const diffPercentage = (changedPixels / totalPixels) * 100;
  const passed = diffPercentage <= threshold;
  
  return {
    diffPercentage,
    diffImageData: diffCanvas.toDataURL('image/png'),
    totalPixels,
    changedPixels,
    passed,
  };
}

/**
 * Create a side-by-side comparison image
 */
export async function createSideBySideComparison(
  baselineData: string,
  currentData: string
): Promise<string> {
  return new Promise((resolve) => {
    const baselineImg = new Image();
    const currentImg = new Image();
    
    let loadedCount = 0;
    
    const onLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        const width = Math.max(baselineImg.width, currentImg.width);
        const height = Math.max(baselineImg.height, currentImg.height);
        
        const canvas = document.createElement('canvas');
        canvas.width = width * 2 + 10; // Gap between images
        canvas.height = height;
        
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(baselineImg, 0, 0);
        ctx.drawImage(currentImg, width + 10, 0);
        
        // Add labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.fillText('Baseline', 10, 20);
        ctx.fillText('Current', width + 20, 20);
        
        resolve(canvas.toDataURL('image/png'));
      }
    };
    
    baselineImg.onload = onLoad;
    currentImg.onload = onLoad;
    
    baselineImg.src = baselineData;
    currentImg.src = currentData;
  });
}
