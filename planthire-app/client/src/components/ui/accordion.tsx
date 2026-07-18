/**
 * Accessible Accordion Component
 * Built on Radix UI Accordion with enhanced WCAG AA compliance.
 * Implements WAI-ARIA Accordion Pattern with proper aria-expanded, aria-controls,
 * and keyboard navigation (Arrow keys, Home, End).
 */

"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateUniqueId } from "@/lib/accessibility"

/**
 * Root Accordion container
 * Supports single or multiple expanded items
 */
const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & {
    /**
     * Accessible label for the accordion group
     */
    "aria-label"?: string
  }
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={cn("w-full", className)}
    {...props}
  />
))
Accordion.displayName = "Accordion"

export interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  /**
   * Unique identifier for the item (used for aria-controls)
   */
  value: string
}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

export interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  /**
   * Optional icon to show instead of the default chevron
   */
  icon?: React.ReactNode
  /**
   * Whether to hide the expand/collapse icon
   */
  hideIcon?: boolean
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, icon, hideIcon = false, ...props }, ref) => {
  // Generate unique ID for content relationship
  const contentId = React.useId()

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all",
          "hover:underline",
          // Enhanced focus styles for WCAG AA compliance
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
          "[&[data-state=open]>svg]:rotate-180",
          "[&[data-state=open]>.accordion-icon]:rotate-180",
          className
        )}
        // aria-expanded is automatically handled by Radix
        // aria-controls is automatically handled by Radix
        {...props}
      >
        {children}
        {!hideIcon && (
          icon ? (
            <span className="accordion-icon shrink-0 transition-transform duration-200" aria-hidden="true">
              {icon}
            </span>
          ) : (
            <ChevronDown
              className="h-4 w-4 shrink-0 transition-transform duration-200"
              aria-hidden="true"
            />
          )
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
})
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

export interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  /**
   * Whether to force content to be mounted in DOM even when closed
   * Useful for SEO or when content needs to be accessible to search
   */
  forceMount?: true
}

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, children, forceMount, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    forceMount={forceMount}
    className={cn(
      "overflow-hidden text-sm transition-all",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      // Ensure content is focusable for keyboard users
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    )}
    // role="region" is automatically applied by Radix when expanded
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

/**
 * Accessible Accordion with FAQ Schema support
 * Use for FAQ sections to get rich results in search engines
 */
export interface FAQAccordionProps {
  /**
   * FAQ items to render
   */
  items: Array<{
    question: string
    answer: string
    id?: string
  }>
  /**
   * Whether to add FAQ schema markup for SEO
   */
  includeSchema?: boolean
  /**
   * Additional class name for the accordion container
   */
  className?: string
}

const FAQAccordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  FAQAccordionProps
>(({ items, includeSchema = true, className }, ref) => {
  // Generate schema.org FAQ markup
  const schemaData = includeSchema ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  } : null

  return (
    <>
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
      <AccordionPrimitive.Root
        ref={ref}
        type="single"
        collapsible
        className={cn("w-full space-y-2", className)}
        aria-label="Frequently Asked Questions"
      >
        {items.map((item, index) => {
          const itemId = item.id || `faq-${index}`
          return (
            <AccordionItem key={itemId} value={itemId}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          )
        })}
      </AccordionPrimitive.Root>
    </>
  )
})
FAQAccordion.displayName = "FAQAccordion"

/**
 * Controlled Accordion Hook
 * For managing accordion state externally
 */
export function useAccordion(defaultValue?: string | string[]) {
  const [value, setValue] = React.useState<string | string[] | undefined>(defaultValue)

  const expand = React.useCallback((itemValue: string) => {
    setValue((prev) => {
      if (Array.isArray(prev)) {
        return [...prev, itemValue]
      }
      return itemValue
    })
  }, [])

  const collapse = React.useCallback((itemValue: string) => {
    setValue((prev) => {
      if (Array.isArray(prev)) {
        return prev.filter((v) => v !== itemValue)
      }
      return undefined
    })
  }, [])

  const toggle = React.useCallback((itemValue: string) => {
    setValue((prev) => {
      if (Array.isArray(prev)) {
        return prev.includes(itemValue)
          ? prev.filter((v) => v !== itemValue)
          : [...prev, itemValue]
      }
      return prev === itemValue ? undefined : itemValue
    })
  }, [])

  const expandAll = React.useCallback((items: string[]) => {
    setValue(items)
  }, [])

  const collapseAll = React.useCallback(() => {
    setValue(Array.isArray(value) ? [] : undefined)
  }, [value])

  return {
    value,
    setValue,
    expand,
    collapse,
    toggle,
    expandAll,
    collapseAll,
    isExpanded: (itemValue: string) =>
      Array.isArray(value) ? value.includes(itemValue) : value === itemValue,
  }
}

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  FAQAccordion
}
