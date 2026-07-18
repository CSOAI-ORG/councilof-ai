/**
 * Accessible Card Component
 * Enhanced with WCAG AA compliance for proper semantic structure and screen reader support.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The semantic role of the card (defaults to "article" for standalone content)
   * Use "region" for important sections, "group" for related items
   */
  role?: "article" | "region" | "group" | "listitem" | undefined
  /**
   * Accessible label for the card (required for role="region")
   */
  "aria-label"?: string
  /**
   * ID of element that labels the card (alternative to aria-label)
   */
  "aria-labelledby"?: string
  /**
   * ID of element that describes the card
   */
  "aria-describedby"?: string
  /**
   * Whether the card is interactive (clickable)
   * When true, proper focus handling is applied
   */
  interactive?: boolean
  /**
   * Whether the card is selected (for selectable card lists)
   */
  selected?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    role,
    interactive = false,
    selected,
    ...props
  }, ref) => {
    // Determine appropriate role
    const cardRole = role || (interactive ? "button" : undefined)

    return (
      <div
        ref={ref}
        role={cardRole}
        tabIndex={interactive ? 0 : undefined}
        aria-selected={selected}
        className={cn(
          "rounded-xl border bg-card text-card-foreground shadow",
          interactive && "cursor-pointer hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          selected && "ring-2 ring-primary",
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether this header contains the main heading for the card
   */
  hasHeading?: boolean
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, hasHeading = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * The heading level (h1-h6). Defaults to h3 for typical card usage.
   * Choose based on document outline.
   */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = "h3", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the footer contains action buttons
   * When true, applies appropriate role for screen readers
   */
  hasActions?: boolean
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, hasActions = false, ...props }, ref) => (
    <div
      ref={ref}
      role={hasActions ? "group" : undefined}
      aria-label={hasActions ? "Card actions" : undefined}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

/**
 * Accessible Card Link - wraps card content for clickable cards
 * Provides proper semantics for linked cards
 */
export interface CardLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Accessible label for the link
   */
  "aria-label"?: string
}

const CardLink = React.forwardRef<HTMLAnchorElement, CardLinkProps>(
  ({ className, children, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
)
CardLink.displayName = "CardLink"

/**
 * Card List - a semantic list of cards
 * Provides proper list semantics for screen readers
 */
export interface CardListProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Accessible label for the list
   */
  "aria-label": string
  /**
   * Layout direction
   */
  direction?: "horizontal" | "vertical" | "grid"
}

const CardList = React.forwardRef<HTMLDivElement, CardListProps>(
  ({ className, direction = "vertical", children, ...props }, ref) => (
    <div
      ref={ref}
      role="list"
      className={cn(
        direction === "horizontal" && "flex flex-row gap-4 overflow-x-auto",
        direction === "vertical" && "flex flex-col gap-4",
        direction === "grid" && "grid gap-4",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Add listitem role to Card children
          return React.cloneElement(child as React.ReactElement<CardProps>, {
            role: "listitem",
          })
        }
        return child
      })}
    </div>
  )
)
CardList.displayName = "CardList"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardLink,
  CardList
}
