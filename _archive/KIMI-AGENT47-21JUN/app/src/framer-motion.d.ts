declare module 'framer-motion' {
  import * as React from 'react';

  interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    whileInView?: any;
    viewport?: any;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    key?: any;
    layout?: boolean;
    layoutId?: string;
  }

  export const motion: {
    div: React.FC<MotionProps & React.HTMLAttributes<HTMLDivElement>>;
    span: React.FC<MotionProps & React.HTMLAttributes<HTMLSpanElement>>;
    button: React.FC<MotionProps & React.ButtonHTMLAttributes<HTMLButtonElement>>;
    svg: React.FC<MotionProps & React.SVGAttributes<SVGSVGElement>>;
    circle: React.FC<MotionProps & React.SVGAttributes<SVGCircleElement>>;
    line: React.FC<MotionProps & React.SVGAttributes<SVGLineElement>>;
    path: React.FC<MotionProps & React.SVGAttributes<SVGPathElement>>;
    g: React.FC<MotionProps & React.SVGAttributes<SVGGElement>>;
    p: React.FC<MotionProps & React.HTMLAttributes<HTMLParagraphElement>>;
    h2: React.FC<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h3: React.FC<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h4: React.FC<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    li: React.FC<MotionProps & React.LiHTMLAttributes<HTMLLIElement>>;
    ul: React.FC<MotionProps & React.HTMLAttributes<HTMLUListElement>>;
    img: React.FC<MotionProps & React.ImgHTMLAttributes<HTMLImageElement>>;
    a: React.FC<MotionProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>;
    [key: string]: any;
  };

  export const AnimatePresence: React.FC<{
    children?: React.ReactNode;
    mode?: 'sync' | 'popLayout' | 'wait';
    initial?: boolean;
    onExitComplete?: () => void;
  }>;
}
