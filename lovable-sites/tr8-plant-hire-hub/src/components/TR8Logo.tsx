interface TR8LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "full" | "compact";
}

const sizeMap = {
  sm: { height: 28, tr8Size: 20, plantHireSize: 8 },
  md: { height: 40, tr8Size: 28, plantHireSize: 10 },
  lg: { height: 56, tr8Size: 40, plantHireSize: 14 },
  xl: { height: 80, tr8Size: 56, plantHireSize: 18 },
};

const TR8Logo = ({ size = "md", className = "", variant = "full" }: TR8LogoProps) => {
  const { height, tr8Size, plantHireSize } = sizeMap[size];

  if (variant === "compact") {
    return (
      <div className={`flex items-center ${className}`} aria-label="TR8 Plant Hire">
        <span 
          className="font-display font-bold tracking-tight text-foreground"
          style={{ fontSize: tr8Size }}
        >
          TR
        </span>
        <span 
          className="font-display font-bold tracking-tight text-primary"
          style={{ fontSize: tr8Size }}
        >
          8
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col leading-none ${className}`} 
      style={{ height }}
      aria-label="TR8 Plant Hire"
    >
      {/* TR8 Row */}
      <div className="flex items-baseline">
        <span 
          className="font-display font-bold tracking-tight text-foreground"
          style={{ fontSize: tr8Size, lineHeight: 1 }}
        >
          TR
        </span>
        <span 
          className="font-display font-bold tracking-tight text-primary"
          style={{ fontSize: tr8Size, lineHeight: 1 }}
        >
          8
        </span>
      </div>
      {/* PLANT HIRE Row */}
      <div className="flex items-baseline -mt-0.5">
        <span 
          className="font-display font-semibold tracking-widest text-foreground uppercase"
          style={{ fontSize: plantHireSize, lineHeight: 1 }}
        >
          Plant
        </span>
        <span 
          className="font-display font-semibold tracking-widest text-primary uppercase ml-1"
          style={{ fontSize: plantHireSize, lineHeight: 1 }}
        >
          Hire
        </span>
      </div>
    </div>
  );
};

export default TR8Logo;
