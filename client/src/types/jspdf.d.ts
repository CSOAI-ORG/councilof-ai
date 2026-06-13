/**
 * Type declarations for jspdf
 * These are stub declarations for PDF generation library
 */

declare module 'jspdf' {
  interface jsPDFOptions {
    orientation?: 'portrait' | 'landscape';
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc';
    format?: string | [number, number];
    compress?: boolean;
    precision?: number;
    userUnit?: number;
    hotfixes?: string[];
    encryption?: {
      userPassword?: string;
      ownerPassword?: string;
      userPermissions?: string[];
    };
    putOnlyUsedFonts?: boolean;
    floatPrecision?: number | 'smart';
  }

  interface TextOptionsLight {
    align?: 'left' | 'center' | 'right' | 'justify';
    baseline?: 'alphabetic' | 'ideographic' | 'bottom' | 'top' | 'middle' | 'hanging';
    angle?: number;
    rotationDirection?: 0 | 1;
    charSpace?: number;
    lineHeightFactor?: number;
    maxWidth?: number;
    renderingMode?: 'fill' | 'stroke' | 'fillThenStroke' | 'invisible' | 'fillAndAddForClipping' | 'strokeAndAddPathForClipping' | 'fillThenStrokeAndAddToPathForClipping' | 'addToPathForClipping';
    isInputVisual?: boolean;
    isOutputVisual?: boolean;
    isInputRtl?: boolean;
    isOutputRtl?: boolean;
    isSymmetricSwapping?: boolean;
  }

  class jsPDF {
    constructor(options?: jsPDFOptions);

    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
        width: number;
        height: number;
      };
      getNumberOfPages(): number;
    };

    addPage(format?: string | [number, number], orientation?: 'portrait' | 'landscape'): jsPDF;
    setPage(pageNumber: number): jsPDF;
    getNumberOfPages(): number;

    text(text: string | string[], x: number, y: number, options?: TextOptionsLight): jsPDF;
    splitTextToSize(text: string, maxWidth: number): string[];
    getTextWidth(text: string): number;

    setFont(fontName: string, fontStyle?: string, fontWeight?: string | number): jsPDF;
    setFontSize(size: number): jsPDF;
    setTextColor(r: number, g?: number, b?: number): jsPDF;

    setDrawColor(r: number, g?: number, b?: number): jsPDF;
    setFillColor(r: number, g?: number, b?: number): jsPDF;
    setLineWidth(width: number): jsPDF;

    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: 'S' | 'F' | 'DF' | 'FD' | null): jsPDF;
    roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: 'S' | 'F' | 'DF' | 'FD'): jsPDF;
    circle(x: number, y: number, r: number, style?: 'S' | 'F' | 'DF' | 'FD'): jsPDF;
    triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, style?: 'S' | 'F' | 'DF' | 'FD'): jsPDF;

    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
      rotation?: number
    ): jsPDF;

    output(type: 'blob'): Blob;
    output(type: 'arraybuffer'): ArrayBuffer;
    output(type: 'datauristring' | 'dataurlstring'): string;
    output(type: 'datauri' | 'dataurl'): void;
    output(type: 'bloburi' | 'bloburl'): string;
    output(type?: 'pdfobjectnewwindow'): void;

    save(filename: string, options?: { returnPromise?: boolean }): jsPDF | Promise<void>;
  }

  export default jsPDF;
  export { jsPDF };
}
