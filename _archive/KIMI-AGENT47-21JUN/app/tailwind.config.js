/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // CSOAI Design Tokens
        gold: {
          DEFAULT: '#D4AF37',
          bright: '#F0C94A',
          dim: '#8B6914',
        },
        cyan: {
          DEFAULT: '#00E5FF',
          dim: '#008B9A',
        },
        'bg-void': '#050508',
        'bg-base': '#0A0A0F',
        'bg-surface': '#12121A',
        'bg-elevated': '#1A1A24',
        'bg-border': '#2A2A35',
        'bg-border-hover': '#3A3A48',
        'text-primary': '#F0F0F5',
        'text-secondary': '#8A8A9A',
        'text-muted': '#5A5A6A',
        'text-gold': '#D4AF37',
        // District colors
        'district-central': '#D4AF37',
        'district-governance': '#9B59B6',
        'district-commerce': '#00E5FF',
        'district-wellness': '#2ECC71',
        'district-innovation': '#E67E22',
        'district-safety': '#E74C3C',
        'district-legal': '#3498DB',
        'district-media': '#ECF0F1',
        'district-residential': '#1ABC9C',
        // Protocol colors
        'protocol-mcp': '#3498DB',
        'protocol-a2a': '#9B59B6',
        'protocol-x402': '#D4AF37',
        'protocol-bft': '#2ECC71',
        'protocol-phero': '#E67E22',
        // Pheromone colors
        'pheromone-alarm': '#FF3366',
        'pheromone-trail': '#00E5FF',
        'pheromone-queen': '#FFD700',
        'pheromone-food': '#39FF14',
        'pheromone-danger': '#BF40BF',
        // Semantic
        success: '#2ECC71',
        warning: '#F39C12',
        danger: '#E74C3C',
        info: '#3498DB',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
        'space-10': '40px',
        'space-12': '48px',
        'space-16': '64px',
        'space-20': '80px',
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'panel': '0 4px 24px rgba(0,0,0,0.4)',
        'gold-glow': '0 0 20px rgba(212,175,55,0.4)',
        'cyan-glow': '0 0 20px rgba(0,229,255,0.4)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(212,175,55,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(212,175,55,0.6)" },
        },
        "pheromone-float": {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "1" },
          "100%": { transform: "translateY(-60px) translateX(20px)", opacity: "0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "fade-in": "fade-in 0.25s ease-out forwards",
        "slide-up": "slide-up 0.3s ease-out forwards",
        "slide-in-left": "slide-in-left 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pheromone-float": "pheromone-float 3s ease-out forwards",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s infinite",
        "spin-slow": "spin-slow 10s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
