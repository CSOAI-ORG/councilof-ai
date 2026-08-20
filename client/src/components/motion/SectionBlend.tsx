/**
 * SectionBlend — melts one full-bleed band into the next so the page stops
 * reading as a stack of hard-cut rectangles.
 *
 * HOW IT SITS IN THE PAGE
 * It is a plain block element in normal document flow, placed BETWEEN two
 * sections (or as the last child of the upper one). It paints `from` as its own
 * background and fills the shape below the curve with `to`. Nothing is absolutely
 * or fixed positioned, it holds no content, `line-height` is zeroed, and it is
 * `aria-hidden` + `pointer-events: none` — so it can never overlap, cover, or
 * hide readable text, and it needs no JavaScript at all.
 *
 * BLENDING INTO AN IMAGE BAND
 * You cannot fill an SVG with a background-image, so set the side that touches
 * the image to `transparent` and put the blend INSIDE the image section:
 *
 *     <section style={{ backgroundImage: 'url(/images/coliseum_hero_arena.jpg)' }}>
 *       …content…
 *       <SectionBlend variant="arch" from="transparent" to="#ffffff" />
 *     </section>
 *     <section className="bg-white">…</section>
 *
 * The transparent half lets the photograph show through; the filled half is the
 * colour of the band that follows.
 */
import type { CSSProperties } from "react";

export type SectionBlendVariant = "wave" | "slope" | "arch" | "fade";

/** `true` mirrors horizontally (same as `'x'`). `'y'` flips the curve vertically. */
export type SectionBlendFlip = boolean | "x" | "y" | "xy";

export interface SectionBlendProps {
  /** Shape of the transition. Default `wave`. */
  variant?: SectionBlendVariant;
  /**
   * Colour of the band ABOVE — becomes the blend's own background.
   * Accepts any CSS colour, `currentColor`, or a var: `var(--background)`.
   * Use `"transparent"` when the band above is an image or gradient.
   */
  from?: string;
  /**
   * Colour of the band BELOW — becomes the fill of the shape.
   * Same rules as `from`; use `"transparent"` when the band below is an image.
   */
  to?: string;
  /** Mirror the shape. Default `false`. */
  flip?: SectionBlendFlip;
  /** Blend height. A number is px; a string is used verbatim (`"6vw"`, `"clamp(48px,6vw,120px)"`). Default 96. */
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

const VIEW_W = 1440;
const VIEW_H = 100;

/**
 * Every path is closed along the BOTTOM edge, so the filled region is always the
 * lower half and the exposed background is always the upper half. Coordinates
 * overshoot the box horizontally (-2 / +2) so non-uniform scaling can never leave
 * a hairline of background at the left or right edge.
 */
const PATHS: Record<Exclude<SectionBlendVariant, "fade">, string> = {
  // Two lazy swells — the default; reads as a soft dissolve rather than a cut.
  wave:
    "M-2,44 C 200,10 340,86 620,58 C 900,30 1080,92 1442,52 L1442,102 L-2,102 Z",
  // A single clean diagonal — good between two flat greys.
  slope: "M-2,102 L-2,86 L1442,8 L1442,102 Z",
  // A broad shallow dome. The coliseum nod: the band below rises as an arch.
  arch:
    "M-2,102 L-2,76 C 288,76 432,6 720,6 C 1008,6 1152,76 1442,76 L1442,102 Z",
};

function flipTransform(flip: SectionBlendFlip | undefined): string | undefined {
  const mode = flip === true ? "x" : flip || "";
  if (mode === "x") return "scaleX(-1)";
  if (mode === "y") return "scaleY(-1)";
  if (mode === "xy") return "scale(-1,-1)";
  return undefined;
}

export function SectionBlend({
  variant = "wave",
  from = "transparent",
  to = "currentColor",
  flip = false,
  height = 96,
  className,
  style,
}: SectionBlendProps) {
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;

  const base: CSSProperties = {
    display: "block",
    width: "100%",
    height: resolvedHeight,
    lineHeight: 0,
    fontSize: 0,
    pointerEvents: "none",
    // Nothing here is fixed, sticky, or pinned. It is a normal-flow block.
    position: "relative",
    ...style,
  };

  if (variant === "fade") {
    return (
      <div
        aria-hidden="true"
        role="presentation"
        className={className}
        style={{
          ...base,
          background: `linear-gradient(${
            flip === "y" || flip === "xy" ? "to top" : "to bottom"
          }, ${from} 0%, ${to} 100%)`,
        }}
      />
    );
  }

  const transform = flipTransform(flip);

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={className}
      style={{ ...base, backgroundColor: from }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        focusable="false"
        aria-hidden="true"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          transform,
          transformOrigin: "center",
          pointerEvents: "none",
        }}
      >
        <path d={PATHS[variant]} fill={to} />
      </svg>
    </div>
  );
}

export default SectionBlend;
