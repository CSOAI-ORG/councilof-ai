# Design Document

## 1. Profile Baseline Declaration

- **Profile selection**: `profiles/strategic.md`
- **Selection rationale**: This is a fundraising pitch deck for MEOK DATA, a new business unit within MEOK AI Labs. The audience is investors, strategic partners, and enterprise clients. The strategic profile's emphasis on data persuasiveness, grand vision, and returns-oriented narrative matches perfectly.
- **Referenced dimensions**: Design philosophy (grand vision, key points prominent, premium feel), information density (medium-high), color guidance (steady, premium, powerful), font guidance (sans-serif bold titles), content expression techniques (TAM, growth curves, competitive matrix), narrative framework (fundraising: Problem → Solution → Market → Model → Traction → Ask).
- **Deviation notes**: Using MEOK AI Labs' existing brand identity (dark slate + teal) rather than generic navy. Slightly more tech-forward aesthetic given the AI infrastructure subject matter.

## 2. Style Baseline Declaration

- **Style anchor selection**: 
  - Primary anchor: **Stripe/Linear pitch decks** — clean, dark-mode tech aesthetic with data-forward layouts, confident typography, and restrained color usage
  - Secondary anchor: **Sequoia Capital pitch templates** — structured narrative flow, one-argument-per-page discipline, big-number emphasis
  - Tertiary anchor: **MEOK AI Labs brand** (meok.ai, councilof.ai) — dark slate backgrounds, teal accents, geometric precision
- **Referenced dimension explanation**: From Stripe/Linear: the dark-mode aesthetic, typography hierarchy, and data visualization style. From Sequoia: the narrative structure and information density discipline. From MEOK brand: the specific color palette and geometric decorative elements.

## 3. Style Details

### Color Design Principles
- **Color tendency**: Between conservative and striking — stability as foundation with bold accent highlights on cover/chapter pages
- **Temperature**: Cool, mineral — deep slate with teal accent conveys tech authority and data precision
- **Primary**: #0f1923 (deep slate) — MEOK brand dark, used for dark page backgrounds and headings
- **Background**: #0f1923 for hero pages, #f7f8fa for light content pages
- **Text**: #e2e8f0 on dark backgrounds, #1a2a3a on light backgrounds
- **Secondary**: #007888 (deep teal) — structural elements, secondary headings
- **Accent**: #00bca8 (bright teal) — key numbers, CTAs, highlights, used sparingly for emphasis
- **Light**: #718096 — captions, annotations, footer text

### Font Usage Principles
- **Title font**: Liter Bold — modern neo-grotesque, clean and rational, perfect for tech/infrastructure positioning
- **Body font**: QuattrocentoSans Regular — classic elegant sans-serif, highly readable at presentation distances
- **Big numbers**: Liter Bold at 52-60px for KPI displays
- **Font size hierarchy**: Cover title 52px → Page titles 32px → Body text 20px → Annotations 14px → Big numbers 56px

### Text Box and Container Styles
- Content separation primarily through whitespace and font size hierarchy
- Cards used sparingly: sharp-cornered rectangles with 1px #e2e8f020 borders on dark pages
- Decorative elements: subtle geometric grid patterns (referencing data/matrix themes), thin accent lines
- No rounded rectangles — sharp corners convey authority and precision

### Image Style
- **Icons**: Outline style, Font Awesome, used for ecosystem pillar visualization (restrained usage)
- **Tables**: Minimal three-line style with teal header accent
- **Charts**: Minimal style, monochrome teal family for series colors, no gridlines
- **Illustrations**: Dark, atmospheric tech imagery — server networks, data flows, abstract geometric patterns

## 4. Layout System

### Global Layout Characteristics
- **Page margins**: 60px top, 80px left/right, 50px bottom
- **Unified elements**: MEOK DATA logo mark (top-left on content pages), thin teal accent line below title area, page category label (top-right, 14px, muted)
- **Grid**: Strict grid alignment, all elements snap to consistent margins

### Special Page Layouts
- **Cover (Page 1)**: Hero design — full dark background (#0f1923) with geometric grid overlay, large title left-aligned with teal accent bar, subtitle below, atmospheric data-flow image on right side with gradient mask
- **Final (Page 10)**: Full dark background, centered large logo, contact details below, geometric decorative elements

### Content Page Layout Patterns
- **Pattern A (Dark emphasis)**: Full dark background for key data pages — big numbers centered, supporting text below, accent color for highlights
- **Pattern B (Light content)**: Light background (#f7f8fa) for text-heavy pages — title top, 2-3 column card layout below
- **Pattern C (Split)**: Left dark panel (40%) with key stat, right light panel (60%) with explanatory content
- **Pattern D (Data table)**: Light background, full-width table with styled headers

## 5. Style Usage Rules

- `title` style: Page titles on all content pages
- `subtitle` style: Cover subtitle, section labels
- `body` style: Main content text on light pages
- `bodyDark` style: Content text on dark background pages
- `bigNumber` style: KPIs, financial figures, key metrics
- `caption` style: Annotations, source notes, footer text
- `label` style: Category tags, tier labels
- Colors: primary for dark backgrounds and headings; secondary for structural elements; accent for highlights and key numbers only
- Table style: default with teal header, alternating light rows

## 6. Risk Prohibitions

- [ ] No rounded rectangles — sharp corners only for strategic authority
- [ ] No gradient backgrounds on content pages — solid colors only
- [ ] No body text below 18px — minimum 20px for presentation readability
- [ ] No unsupported claims — every metric tied to existing MEOK data
- [ ] No rainbow/multi-color charts — monochrome teal family
- [ ] No generic stock photos — use abstract data/tech imagery or brand elements
- [ ] No information overload — max 6 points per page
- [ ] No vague returns — all projections include conversion assumptions
- [ ] Accent color used sparingly — never more than 20% of page area
- [ ] Title font size minimum 28px; annotation minimum 14px

## 7. Theme Definition

```yaml
theme:
  colors:
    primary: "#0f1923"
    secondary: "#007888"
    accent: "#00bca8"
    background: "#f7f8fa"
    text: "#1a2a3a"
    textLight: "#e2e8f0"
    muted: "#718096"
    cardBg: "#ffffff"
    darkCardBg: "#1a2a3a"
  textStyles:
    title:
      fontSize: 32
      color: "$textLight"
      fontFamily: "Liter"
      lineHeight: 1.2
    subtitle:
      fontSize: 22
      color: "$muted"
      fontFamily: "QuattrocentoSans"
      lineHeight: 1.4
    body:
      fontSize: 20
      color: "$text"
      fontFamily: "QuattrocentoSans"
      lineHeight: 1.6
    bodyDark:
      fontSize: 20
      color: "$textLight"
      fontFamily: "QuattrocentoSans"
      lineHeight: 1.6
    bigNumber:
      fontSize: 56
      color: "$accent"
      fontFamily: "Liter"
      lineHeight: 1.1
    caption:
      fontSize: 14
      color: "$muted"
      fontFamily: "QuattrocentoSans"
      lineHeight: 1.4
    label:
      fontSize: 16
      color: "$accent"
      fontFamily: "Liter"
      letterSpacing: 2
  tableStyles:
    default:
      headerFill: "$secondary"
      headerColor: "#ffffff"
      headerBold: true
      bodyFill: ["#ffffff", "#f0f4f8"]
      bodyColor: "$text"
      border:
        style: solid
        width: 1
        color: "#e2e8f0"
```
