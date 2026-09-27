import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { COUNCIL_BRAND } from "@/lib/brand";
import "./CouncilBrand.css";
export type CouncilBrandSize = "sm" | "md" | "lg";
export interface CouncilBrandProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  context?: string;
  strapline?: string;
  size?: CouncilBrandSize;
  variant?: "compact" | "full" | "responsive";
}
/** Original uploaded master paths; no CSS font substitution or re-drawn shield. */
export function CouncilBrand({ className, context, size = "md", strapline, variant = "compact", ...props }: CouncilBrandProps) {
  return <span {...props} data-council-brand="true" data-brand-variant={variant}
    className={cn("council-brand", `council-brand--${size}`, `council-brand--${variant}`, className)}>
    <span className="council-brand__art">
      {variant === "responsive" ? <picture>
        <source media="(min-width: 1440px)" srcSet={COUNCIL_BRAND.assets.full} />
        <img src={COUNCIL_BRAND.assets.compact} alt={COUNCIL_BRAND.name} width={1004} height={216} decoding="async" />
      </picture> : <img src={variant === "full" ? COUNCIL_BRAND.assets.full : COUNCIL_BRAND.assets.compact}
        alt={variant === "full" ? `${COUNCIL_BRAND.name} — ${COUNCIL_BRAND.fullName}` : COUNCIL_BRAND.name}
        width={variant === "full" ? 1038 : 1004} height={variant === "full" ? 280 : 216} decoding="async" />}
    </span>
    {(context || strapline) && <span className="council-brand__context">
      {context && <span>{context}</span>}{strapline && <span className="council-brand__strapline">{strapline}</span>}
    </span>}
  </span>;
}
