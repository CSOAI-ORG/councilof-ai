import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "yellow" | "navy" | "white";
  className?: string;
}

const Badge = ({ children, variant = "default", className }: BadgeProps) => {
  const variants = {
    default: "bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))]",
    yellow: "bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))]",
    navy: "bg-[hsl(var(--gts-navy))] text-white",
    white: "bg-white text-[hsl(var(--gts-dark))]"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;