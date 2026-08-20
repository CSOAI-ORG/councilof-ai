/**
 * GrainOverlay — a very light SVG `feTurbulence` grain laid over a large flat
 * area so gradients stop banding on cheap panels.
 *
 * CHEAP BY CONSTRUCTION
 *  - One 180×180 tile, inlined as a data URI and repeated by the compositor. No
 *    network request, no filter re-evaluation, no animation, no scroll listener.
 *  - OFF ON MOBILE BY DEFAULT (`enableOnMobile={false}`): the initial render is
 *    always "no grain", and a media-query effect turns it on for wide viewports
 *    only. Small screens never pay for it and never flash it.
 *  - `position: absolute` inside a `position: relative` parent (never `fixed`),
 *    `aria-hidden`, `pointer-events: none`, zero content. It cannot cover, hide,
 *    or capture anything; if it never renders the section is unchanged.
 *
 *     <section className="relative …">
 *       <GrainOverlay />
 *       …content…
 *     </section>
 */
import { useMemo, type CSSProperties } from "react";
import { useMediaQuery } from "./scrollEngine";

export interface GrainOverlayProps {
  /** How visible the grain is. Keep it tiny — 0.02 to 0.06. Default 0.035. */
  opacity?: number;
  /** Turbulence frequency; higher is finer. Default 0.8. */
  baseFrequency?: number;
  /** Tile size in px. Default 180. */
  tile?: number;
  /** Render on small screens too. Default false. */
  enableOnMobile?: boolean;
  /** Media query treated as "not mobile". Default `(min-width: 768px)`. */
  desktopQuery?: string;
  /** Blend mode for the grain. Default `overlay`. */
  blendMode?: CSSProperties["mixBlendMode"];
  className?: string;
  style?: CSSProperties;
}

export function GrainOverlay({
  opacity = 0.035,
  baseFrequency = 0.8,
  tile = 180,
  enableOnMobile = false,
  desktopQuery = "(min-width: 768px)",
  blendMode = "overlay",
  className,
  style,
}: GrainOverlayProps) {
  const wide = useMediaQuery(desktopQuery);
  const show = enableOnMobile || wide;

  const dataUri = useMemo(() => {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}">` +
      `<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="2" stitchTiles="stitch"/>` +
      `<feColorMatrix type="saturate" values="0"/></filter>` +
      `<rect width="100%" height="100%" filter="url(#g)"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [tile, baseFrequency]);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: dataUri,
        backgroundRepeat: "repeat",
        backgroundSize: `${tile}px ${tile}px`,
        opacity,
        mixBlendMode: blendMode,
        ...style,
      }}
      data-motion="grain-overlay"
    />
  );
}

export default GrainOverlay;
