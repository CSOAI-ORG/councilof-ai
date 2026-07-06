# CSOAI Design System & Branding Guidelines

## Brand Identity

### Brand Essence
**Authority • Transparency • Humanity • Innovation**

CSOAI is the Western standard for AI safety governance - professional, trustworthy, and human-centered.

---

## Color Palette

### Primary Colors
```css
--coai-blue-900: #0A2540;    /* Deep authority blue - headers, nav */
--coai-blue-700: #1E3A5F;    /* Primary blue - CTAs, links */
--coai-blue-500: #3B82F6;    /* Bright blue - accents, hover states */
--coai-blue-300: #93C5FD;    /* Light blue - backgrounds, borders */
--coai-blue-100: #DBEAFE;    /* Pale blue - subtle backgrounds */
```

### Secondary Colors
```css
--coai-green-600: #059669;   /* Success, approval, growth */
--coai-green-100: #D1FAE5;   /* Success backgrounds */

--coai-red-600: #DC2626;     /* Danger, rejection, alerts */
--coai-red-100: #FEE2E2;     /* Danger backgrounds */

--coai-yellow-600: #D97706;  /* Warning, escalation */
--coai-yellow-100: #FEF3C7;  /* Warning backgrounds */

--coai-purple-600: #7C3AED;  /* Premium, enterprise */
--coai-purple-100: #EDE9FE;  /* Premium backgrounds */
```

### Neutral Colors
```css
--coai-gray-900: #111827;    /* Body text */
--coai-gray-700: #374151;    /* Secondary text */
--coai-gray-500: #6B7280;    /* Muted text */
--coai-gray-300: #D1D5DB;    /* Borders */
--coai-gray-100: #F3F4F6;    /* Backgrounds */
--coai-gray-50: #F9FAFB;     /* Subtle backgrounds */
--coai-white: #FFFFFF;       /* Pure white */
```

### Gradient System
```css
/* Hero Gradients */
--gradient-hero: linear-gradient(135deg, #0A2540 0%, #1E3A5F 50%, #3B82F6 100%);
--gradient-hero-overlay: linear-gradient(180deg, rgba(10,37,64,0.9) 0%, rgba(10,37,64,0.7) 100%);

/* CTA Gradients */
--gradient-cta: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
--gradient-cta-hover: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);

/* Success Gradient */
--gradient-success: linear-gradient(135deg, #059669 0%, #047857 100%);

/* Premium Gradient */
--gradient-premium: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
```

---

## Typography

### Font Families
```css
/* Primary Font - Headings */
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
font-weight: 700-900;

/* Secondary Font - Body */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
font-weight: 400-600;

/* Monospace - Code */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### Type Scale
```css
/* Display (Hero Headlines) */
--text-display-xl: 72px / 1.1 / 900;  /* Desktop hero */
--text-display-lg: 60px / 1.1 / 900;  /* Section heroes */
--text-display-md: 48px / 1.2 / 800;  /* Page titles */

/* Headings */
--text-h1: 36px / 1.2 / 700;
--text-h2: 30px / 1.3 / 700;
--text-h3: 24px / 1.4 / 600;
--text-h4: 20px / 1.4 / 600;
--text-h5: 18px / 1.5 / 600;

/* Body */
--text-lg: 18px / 1.6 / 400;  /* Lead paragraphs */
--text-base: 16px / 1.6 / 400; /* Body text */
--text-sm: 14px / 1.5 / 400;   /* Small text */
--text-xs: 12px / 1.4 / 500;   /* Labels, captions */

/* Special */
--text-button: 16px / 1 / 600;  /* Button text */
--text-stat: 48px / 1 / 800;    /* Large numbers */
```

### Mobile Type Scale (< 768px)
```css
--text-display-xl-mobile: 40px / 1.1 / 900;
--text-display-lg-mobile: 36px / 1.2 / 900;
--text-h1-mobile: 28px / 1.2 / 700;
--text-h2-mobile: 24px / 1.3 / 700;
```

---

## Spacing System

### Base Unit: 4px

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
```

### Section Spacing
```css
--section-padding-y: 96px;  /* Desktop */
--section-padding-y-mobile: 64px;  /* Mobile */
--section-padding-x: 24px;  /* Horizontal padding */
```

---

## Layout System

### Container Widths
```css
--container-sm: 640px;   /* Small content */
--container-md: 768px;   /* Medium content */
--container-lg: 1024px;  /* Large content */
--container-xl: 1280px;  /* Extra large content */
--container-2xl: 1536px; /* Full width sections */
```

### Grid System
```css
/* 12-column grid */
display: grid;
grid-template-columns: repeat(12, 1fr);
gap: 24px;

/* Common layouts */
.two-col { grid-column: span 6; }
.three-col { grid-column: span 4; }
.four-col { grid-column: span 3; }
```

---

## Component Styles

### Buttons

#### Primary CTA
```css
background: var(--gradient-cta);
color: white;
padding: 16px 32px;
border-radius: 8px;
font-size: 16px;
font-weight: 600;
box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
transition: all 0.2s ease;

hover:
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
```

#### Secondary CTA
```css
background: white;
color: var(--coai-blue-700);
border: 2px solid var(--coai-blue-700);
padding: 14px 30px;
border-radius: 8px;
font-size: 16px;
font-weight: 600;
transition: all 0.2s ease;

hover:
  background: var(--coai-blue-50);
  transform: translateY(-2px);
```

#### Ghost Button
```css
background: transparent;
color: var(--coai-blue-700);
padding: 14px 30px;
border-radius: 8px;
font-size: 16px;
font-weight: 600;
transition: all 0.2s ease;

hover:
  background: var(--coai-blue-50);
```

### Cards

#### Standard Card
```css
background: white;
border: 1px solid var(--coai-gray-200);
border-radius: 12px;
padding: 32px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
transition: all 0.3s ease;

hover:
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
```

#### Feature Card
```css
background: white;
border: 2px solid var(--coai-blue-100);
border-radius: 16px;
padding: 40px;
text-align: center;
transition: all 0.3s ease;

hover:
  border-color: var(--coai-blue-500);
  box-shadow: 0 12px 40px rgba(59, 130, 246, 0.15);
```

### Badges

#### Status Badge
```css
padding: 4px 12px;
border-radius: 9999px;
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.5px;

/* Variants */
.badge-success { background: var(--coai-green-100); color: var(--coai-green-600); }
.badge-danger { background: var(--coai-red-100); color: var(--coai-red-600); }
.badge-warning { background: var(--coai-yellow-100); color: var(--coai-yellow-600); }
.badge-info { background: var(--coai-blue-100); color: var(--coai-blue-700); }
```

---

## Animation System

### Timing Functions
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Durations
```css
--duration-fast: 150ms;
--duration-base: 250ms;
--duration-slow: 400ms;
--duration-slower: 600ms;
```

### Common Animations

#### Fade In Up
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: fadeInUp 0.6s ease-out;
```

#### Scale In
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

animation: scaleIn 0.4s ease-out;
```

#### Pulse (for live indicators)
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

animation: pulse 2s ease-in-out infinite;
```

---

## Iconography

### Icon Style
- **Library:** Lucide Icons
- **Size:** 24px default, 20px small, 32px large
- **Stroke Width:** 2px
- **Color:** Inherit from parent or use semantic colors

### Common Icons
```
- Shield: Safety, protection
- Eye: Watchdog, monitoring
- Users: Community, analysts
- CheckCircle: Approval, success
- AlertTriangle: Warning, risk
- TrendingUp: Growth, improvement
- Globe: Global, public
- Lock: Security, compliance
- Zap: Speed, efficiency
- Award: Certification, achievement
```

---

## Shadows

### Elevation System
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.15);

/* Colored shadows for CTAs */
--shadow-blue: 0 10px 30px rgba(59, 130, 246, 0.3);
--shadow-green: 0 10px 30px rgba(5, 150, 105, 0.3);
```

---

## Responsive Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet portrait */
--breakpoint-lg: 1024px;  /* Tablet landscape */
--breakpoint-xl: 1280px;  /* Desktop */
--breakpoint-2xl: 1536px; /* Large desktop */
```

### Mobile-First Approach
```css
/* Base styles for mobile */
.element {
  font-size: 16px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .element {
    font-size: 18px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .element {
    font-size: 20px;
  }
}
```

---

## Accessibility

### Color Contrast
- **AA Standard:** Minimum 4.5:1 for body text
- **AAA Standard:** Minimum 7:1 for headings
- All text meets WCAG 2.1 Level AA

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--coai-blue-500);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Interactive Elements
- Minimum tap target: 44x44px
- Clear hover states
- Visible focus indicators
- Keyboard navigation support

---

## Brand Voice

### Tone
- **Professional** but approachable
- **Authoritative** but not intimidating
- **Transparent** and honest
- **Empowering** and optimistic

### Writing Style
- Short sentences (< 20 words)
- Active voice
- Clear, jargon-free language
- Specific numbers and data
- Action-oriented CTAs

### Example Headlines
✅ "AI is taking jobs. We're creating them."
✅ "Get paid to protect humanity from AI"
✅ "Turn AI anxiety into AI income"
✅ "The Western TC260 - proven, trusted, transparent"

❌ "Leverage synergies for AI governance optimization"
❌ "Best-in-class solutions for enterprise stakeholders"
❌ "Revolutionizing the paradigm of safety oversight"

---

## Implementation Checklist

### CSS Variables Setup
```css
:root {
  /* Colors */
  --coai-blue-900: #0A2540;
  /* ... all color variables ... */
  
  /* Typography */
  --font-display: 'Inter', sans-serif;
  /* ... all font variables ... */
  
  /* Spacing */
  --space-4: 16px;
  /* ... all spacing variables ... */
  
  /* Shadows */
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  /* ... all shadow variables ... */
}
```

### Component Library
- [ ] Button variants (primary, secondary, ghost)
- [ ] Card variants (standard, feature, stat)
- [ ] Badge variants (success, danger, warning, info)
- [ ] Form inputs (text, select, checkbox, radio)
- [ ] Navigation (header, sidebar, footer)
- [ ] Modals and dialogs
- [ ] Tooltips and popovers
- [ ] Loading states
- [ ] Empty states
- [ ] Error states

### Animation Library
- [ ] Fade in/out
- [ ] Slide in/out
- [ ] Scale in/out
- [ ] Rotate
- [ ] Pulse
- [ ] Bounce
- [ ] Page transitions

---

## Design Principles

### 1. Clarity Over Cleverness
Every element should have a clear purpose. No decoration for decoration's sake.

### 2. Consistency Builds Trust
Use the same patterns, colors, and spacing throughout the site.

### 3. Speed is a Feature
Optimize for performance. Fast sites feel more professional.

### 4. Mobile First, Always
Design for mobile, enhance for desktop.

### 5. Accessibility is Non-Negotiable
Every user should be able to access every feature.

### 6. Data Tells the Story
Use real numbers, real stats, real proof.

### 7. White Space is Your Friend
Don't cram. Let content breathe.

### 8. CTAs Should Be Obvious
Never make users hunt for the next action.
