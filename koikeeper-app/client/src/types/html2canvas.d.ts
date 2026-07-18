/**
 * Type declarations for html2canvas
 * These are stub declarations for HTML to canvas rendering library
 */

declare module 'html2canvas' {
  interface Html2CanvasOptions {
    /** Whether to allow cross-origin images to taint the canvas */
    allowTaint?: boolean;
    /** Canvas background color, if none is specified in DOM. Set null for transparent */
    backgroundColor?: string | null;
    /** Existing canvas element to use as a base for drawing on */
    canvas?: HTMLCanvasElement | null;
    /** Whether to use ForeignObject rendering if the browser supports it */
    foreignObjectRendering?: boolean;
    /** Predicate function which removes the matching elements from the render */
    ignoreElements?: (element: Element) => boolean;
    /** Timeout for loading images, in milliseconds. Setting it to 0 will result in no timeout. */
    imageTimeout?: number;
    /** Whether to log events in the console */
    logging?: boolean;
    /** Callback function which is called when the Document has been cloned for rendering, can be used to modify the contents that will be rendered without affecting the original source document. */
    onclone?: ((document: Document, element: HTMLElement) => void) | null;
    /** URL used as base for images */
    proxy?: string | null;
    /** Whether to cleanup the cloned DOM elements html2canvas creates temporarily */
    removeContainer?: boolean;
    /** The scale to use for rendering. Defaults to the browsers device pixel ratio. */
    scale?: number;
    /** Whether to attempt to load images from a server using CORS */
    useCORS?: boolean;
    /** Define the width of the canvas in pixels. If null, renders with full width of the window. */
    width?: number | null;
    /** Define the height of the canvas in pixels. If null, renders with full height of the window. */
    height?: number | null;
    /** Crop canvas x-coordinate */
    x?: number;
    /** Crop canvas y-coordinate */
    y?: number;
    /** The x-scroll position to used when rendering element, (for example if the Element uses position: fixed) */
    scrollX?: number;
    /** The y-scroll position to used when rendering element, (for example if the Element uses position: fixed) */
    scrollY?: number;
    /** Window width to use when rendering Element */
    windowWidth?: number;
    /** Window height to use when rendering Element */
    windowHeight?: number;
  }

  /**
   * Renders an HTML element to a canvas
   * @param element The element to render
   * @param options Options for rendering
   * @returns A promise that resolves to the rendered canvas
   */
  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>;

  export default html2canvas;
  export { html2canvas, Html2CanvasOptions };
}
