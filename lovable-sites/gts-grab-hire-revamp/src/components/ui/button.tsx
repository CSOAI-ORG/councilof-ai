import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // GTS Custom Variants - Navy, Yellow, White Only
        primary: "bg-[hsl(var(--gts-yellow))] hover:bg-[hsl(51_95%_45%)] text-[hsl(var(--gts-dark))] font-semibold shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] hover:scale-105 [&_svg]:text-[hsl(var(--gts-dark))] [&_svg]:fill-[hsl(var(--gts-dark))]",
        cta: "bg-[hsl(var(--gts-yellow))] hover:bg-[hsl(51_95%_45%)] text-[hsl(var(--gts-dark))] font-bold shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-hover)] hover:scale-105 px-8 [&_svg]:text-[hsl(var(--gts-dark))] [&_svg]:fill-[hsl(var(--gts-dark))]",
        outlineWhite: "border-2 border-white bg-transparent text-white hover:bg-white hover:text-[hsl(var(--gts-dark))] font-semibold [&_svg]:text-white hover:[&_svg]:text-[hsl(var(--gts-dark))] hover:[&_svg]:fill-[hsl(var(--gts-dark))]",
        navy: "bg-[hsl(var(--gts-navy))] text-white hover:bg-[hsl(var(--gts-dark))] font-semibold [&_svg]:text-white [&_svg]:fill-white"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
