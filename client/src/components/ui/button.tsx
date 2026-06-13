/**
 * Accessible Button Component
 * Enhanced with WCAG AA compliance for keyboard navigation, screen readers, and focus indicators.
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * If true, renders as a child component (using Radix Slot)
   */
  asChild?: boolean
  /**
   * Indicates whether the button is in a pressed state (for toggle buttons)
   * When true, aria-pressed="true" is set
   * When false, aria-pressed="false" is set
   * When undefined, aria-pressed is not included (not a toggle button)
   */
  pressed?: boolean
  /**
   * Loading state - disables button and shows loading indicator
   */
  loading?: boolean
  /**
   * Description for screen readers (sets aria-describedby)
   */
  description?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    pressed,
    loading = false,
    description,
    disabled,
    children,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    // Generate unique ID for description if provided
    const descriptionId = React.useId()

    // Determine aria-pressed value
    const ariaPressed = pressed !== undefined ? pressed : undefined

    // Build aria-describedby
    const ariaDescribedBy = description ? descriptionId : props['aria-describedby']

    return (
      <>
        <Comp
          className={cn(
            buttonVariants({ variant, size, className }),
            loading && "cursor-wait",
            ariaPressed === true && "ring-2 ring-ring ring-offset-1"
          )}
          ref={ref}
          disabled={isDisabled}
          aria-disabled={isDisabled || undefined}
          aria-pressed={ariaPressed}
          aria-busy={loading || undefined}
          aria-describedby={ariaDescribedBy}
          {...props}
        >
          {loading && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {children}
        </Comp>
        {/* Visually hidden description for screen readers */}
        {description && (
          <span
            id={descriptionId}
            className="sr-only"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {description}
          </span>
        )}
      </>
    )
  }
)
Button.displayName = "Button"

/**
 * Toggle Button - a button that can be toggled on/off
 * Automatically handles aria-pressed state
 */
export interface ToggleButtonProps extends Omit<ButtonProps, 'pressed'> {
  /**
   * Controlled pressed state
   */
  pressed: boolean
  /**
   * Callback when pressed state changes
   */
  onPressedChange?: (pressed: boolean) => void
}

const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ pressed, onPressedChange, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onPressedChange?.(!pressed)
      onClick?.(e)
    }

    return (
      <Button
        ref={ref}
        pressed={pressed}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
ToggleButton.displayName = "ToggleButton"

/**
 * Icon Button - a button with only an icon
 * Requires aria-label for accessibility
 */
export interface IconButtonProps extends ButtonProps {
  /**
   * Required label for screen readers
   */
  'aria-label': string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = "icon", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        {...props}
      />
    )
  }
)
IconButton.displayName = "IconButton"

export { Button, ToggleButton, IconButton, buttonVariants }
