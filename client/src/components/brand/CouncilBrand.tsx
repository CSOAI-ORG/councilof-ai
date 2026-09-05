import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CouncilBrandSize = "sm" | "md" | "lg";

export interface CouncilBrandProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /** Product or workspace context. The institution remains the primary name. */
  context?: string;
  /** Optional plain-language descriptor beneath the wordmark. */
  strapline?: string;
  size?: CouncilBrandSize;
}

const sizeStyles: Record<
  CouncilBrandSize,
  { mark: string; wordmark: string; context: string; strapline: string }
> = {
  sm: {
    mark: "h-8 w-8",
    wordmark: "text-lg",
    context: "text-[10px]",
    strapline: "text-[11px]",
  },
  md: {
    mark: "h-10 w-10",
    wordmark: "text-xl 2xl:text-2xl",
    context: "text-[11px]",
    strapline: "text-xs",
  },
  lg: {
    mark: "h-12 w-12",
    wordmark: "text-2xl",
    context: "text-xs",
    strapline: "text-sm",
  },
};

/**
 * Canonical Council of AI identity lockup.
 *
 * The flat shield and institutional wordmark are invariant. Product names are
 * deliberately secondary context so public pages and Council OS read as one
 * system rather than separate brands.
 */
export function CouncilBrand({
  className,
  context,
  size = "md",
  strapline,
  ...props
}: CouncilBrandProps) {
  const styles = sizeStyles[size];

  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-2.5", className)}
      data-council-brand="true"
      {...props}
    >
      <img
        src="/csoai-icon.svg"
        alt=""
        aria-hidden="true"
        width={48}
        height={48}
        decoding="async"
        className={cn("shrink-0", styles.mark)}
      />
      <span className="min-w-0 leading-none">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "whitespace-nowrap font-bold tracking-tight text-brand-institutional",
              styles.wordmark,
            )}
          >
            Council of AI
          </span>
          {context ? (
            <span
              className={cn(
                "whitespace-nowrap font-semibold uppercase tracking-[0.14em] text-muted-foreground",
                styles.context,
              )}
            >
              {context}
            </span>
          ) : null}
        </span>
        {strapline ? (
          <span
            className={cn("mt-1 block text-muted-foreground", styles.strapline)}
          >
            {strapline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
