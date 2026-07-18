# CSOAI Brand Guidelines

**Version:** 2.0  
**Date:** December 25, 2024  
**Design Philosophy:** Clean, Professional, Trustworthy (Udemy-inspired)

---

## Brand Identity

**Full Name:** CSOAI (Compliance-Oriented AI Safety)  
**Tagline:** "Building the Future of AI Safety, One Analyst at a Time"  
**Mission:** Create AI safety jobs while protecting humanity through independent training, certification, and transparent oversight.

---

## Color Palette

### Primary Colors
- **Emerald Green:** `#10b981` (rgb(16, 185, 129))
  - Use for: Primary CTAs, links, active states, success messages
  - Represents: Trust, growth, safety, certification

- **White:** `#ffffff`
  - Use for: Backgrounds, cards, text on dark backgrounds
  - Represents: Clarity, transparency, professionalism

### Secondary Colors
- **Dark Slate:** `#1e293b` (rgb(30, 41, 59))
  - Use for: Headers, primary text, navigation
  - Represents: Authority, professionalism

- **Light Gray:** `#f8fafc` (rgb(248, 250, 252))
  - Use for: Subtle backgrounds, section dividers
  - Represents: Clean, modern interface

- **Medium Gray:** `#64748b` (rgb(100, 116, 139))
  - Use for: Secondary text, descriptions, metadata
  - Represents: Supporting information

### Accent Colors
- **Success Green:** `#059669` (darker emerald for hover states)
- **Warning Amber:** `#f59e0b` (for alerts, pending states)
- **Error Red:** `#ef4444` (for errors, critical issues)
- **Info Blue:** `#3b82f6` (for informational messages)

---

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### Hierarchy
- **H1 (Hero):** 48px / 3rem, font-weight: 700, line-height: 1.2
- **H2 (Section):** 36px / 2.25rem, font-weight: 700, line-height: 1.3
- **H3 (Subsection):** 24px / 1.5rem, font-weight: 600, line-height: 1.4
- **H4 (Card Title):** 18px / 1.125rem, font-weight: 600, line-height: 1.5
- **Body Large:** 18px / 1.125rem, font-weight: 400, line-height: 1.6
- **Body:** 16px / 1rem, font-weight: 400, line-height: 1.6
- **Body Small:** 14px / 0.875rem, font-weight: 400, line-height: 1.5
- **Caption:** 12px / 0.75rem, font-weight: 400, line-height: 1.4

---

## Logo Usage

### Primary Logo
- **File:** `/csoai-logo.svg.png`
- **Minimum Size:** 120px wide
- **Clear Space:** Minimum 20px padding on all sides
- **Backgrounds:** Use on white or light gray backgrounds

### Icon Only
- **File:** `/csoai-icon.svg.png`
- **Use Cases:** Favicon, app icons, small spaces
- **Minimum Size:** 32x32px
- **Maximum Size:** 512x512px

### Logo Don'ts
- ❌ Don't stretch or distort
- ❌ Don't change colors (always emerald green)
- ❌ Don't add effects (shadows, gradients, outlines)
- ❌ Don't place on busy backgrounds

---

## Component Design Patterns

### Buttons

**Primary Button:**
```
Background: #10b981 (emerald)
Text: #ffffff (white)
Padding: 12px 24px
Border-radius: 8px
Font-weight: 600
Hover: #059669 (darker emerald)
```

**Secondary Button:**
```
Background: transparent
Border: 2px solid #10b981
Text: #10b981
Padding: 12px 24px
Border-radius: 8px
Font-weight: 600
Hover: Background #10b981, Text #ffffff
```

**Ghost Button:**
```
Background: transparent
Text: #64748b
Padding: 12px 24px
Font-weight: 500
Hover: Text #10b981
```

### Cards
```
Background: #ffffff
Border: 1px solid #e2e8f0
Border-radius: 12px
Padding: 24px
Box-shadow: 0 1px 3px rgba(0,0,0,0.1)
Hover: Box-shadow: 0 4px 6px rgba(0,0,0,0.1)
```

### Input Fields
```
Background: #ffffff
Border: 1px solid #e2e8f0
Border-radius: 8px
Padding: 12px 16px
Focus: Border #10b981, Box-shadow: 0 0 0 3px rgba(16,185,129,0.1)
```

### Navigation
```
Background: #ffffff
Border-bottom: 1px solid #e2e8f0
Height: 72px
Logo: Left-aligned
Links: Center or right-aligned
CTA Button: Right-aligned, primary style
```

### Footer
```
Background: #1e293b (dark slate)
Text: #ffffff / #cbd5e1
Padding: 48px 0
Sections: 4 columns on desktop, stack on mobile
Links: #cbd5e1, Hover: #10b981
```

---

## Spacing System

Use 4px base unit (Tailwind's default):
- **xs:** 4px (0.25rem)
- **sm:** 8px (0.5rem)
- **md:** 16px (1rem)
- **lg:** 24px (1.5rem)
- **xl:** 32px (2rem)
- **2xl:** 48px (3rem)
- **3xl:** 64px (4rem)
- **4xl:** 96px (6rem)

---

## Layout Guidelines

### Container Widths
- **Max Width:** 1280px (Tailwind's `max-w-7xl`)
- **Padding:** 16px mobile, 24px tablet, 32px desktop
- **Centered:** Always use `mx-auto` for centering

### Grid System
- **Desktop:** 12-column grid
- **Tablet:** 8-column grid
- **Mobile:** 4-column grid
- **Gap:** 24px (1.5rem)

### Section Spacing
- **Between Sections:** 96px (6rem) desktop, 64px (4rem) mobile
- **Within Sections:** 48px (3rem)

---

## Design Principles

### 1. Clean & Minimal
- Generous whitespace
- Clear visual hierarchy
- No clutter or unnecessary elements

### 2. Professional & Trustworthy
- Consistent branding
- High-quality imagery
- Clear, confident copy

### 3. User-Focused
- Intuitive navigation
- Clear CTAs
- Accessible (WCAG AA compliant)

### 4. Modern & Scalable
- Responsive design
- Fast loading
- Future-proof architecture

---

## Inspiration References

**Design Quality Level:**
- Udemy (clean, professional training platform)
- Coursera (academic credibility)
- LinkedIn Learning (corporate trust)
- Stripe (modern, developer-friendly)

**NOT Like:**
- Cluttered dashboards
- Overly colorful/playful designs
- Generic Bootstrap templates
- Outdated corporate sites

---

## Voice & Tone

### Brand Voice
- **Professional** but not corporate
- **Confident** but not arrogant
- **Clear** but not simplistic
- **Inspiring** but not preachy

### Tone Guidelines
- **Headlines:** Bold, action-oriented
- **Body Copy:** Clear, informative, helpful
- **CTAs:** Direct, benefit-focused
- **Error Messages:** Helpful, not blaming

### Example Copy
- ✅ "Start Your AI Safety Career Today"
- ❌ "Click Here to Begin"
- ✅ "Join 10,000+ Certified Analysts Worldwide"
- ❌ "Lots of people use our platform"

---

## Implementation Checklist

### Every Page Must Have:
- [ ] Consistent header with logo and navigation
- [ ] Clear page title and breadcrumbs (if nested)
- [ ] Proper spacing and whitespace
- [ ] Consistent footer with links
- [ ] Mobile-responsive design
- [ ] Loading states for async actions
- [ ] Error handling with helpful messages
- [ ] Accessible (keyboard navigation, ARIA labels)

### Every Component Must Have:
- [ ] Consistent styling with design system
- [ ] Hover/focus/active states
- [ ] Proper spacing (padding/margin)
- [ ] Responsive breakpoints
- [ ] TypeScript types
- [ ] Unit tests (for backend)

---

**This is the CSOAI standard. Every pixel matters. Every interaction counts.**
