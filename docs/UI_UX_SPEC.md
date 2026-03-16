# Sotally UI/UX Design Specification

> **Version:** 1.0.0
> **Last Updated:** 2026-03-16
> **Tech Stack:** Next.js 15, Tailwind CSS 4, shadcn/ui, Framer Motion
> **Target:** Credit-based software tool marketplace ("YouTube for software")
> **User Roles:** Buyers, Creators, Affiliates, Admins

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Design System](#2-design-system)
3. [Page Layouts](#3-page-layouts)
4. [User Flows](#4-user-flows)
5. [Responsive Breakpoints](#5-responsive-breakpoints)
6. [Interaction Patterns](#6-interaction-patterns)
7. [Accessibility](#7-accessibility)
8. [Performance Targets](#8-performance-targets)

---

## 1. Design Principles

### 1.1 Mobile-First Always

Over 60% of expected traffic will come from mobile devices. Every design decision
starts at 320px and scales up. This is not "responsive as an afterthought" --
mobile is the primary design target.

**Implications:**
- Touch targets minimum 44x44px
- Single-column layouts as the base
- Bottom navigation for primary actions on mobile
- Thumb-zone optimization for critical CTAs
- No hover-dependent interactions (hover enhances, never gates)

### 1.2 Progressive Disclosure

Users should never face a wall of complexity. Information and options reveal
themselves as the user demonstrates intent and need.

**Application:**
- Tool detail pages show essential info first (name, rating, price, run button)
- Advanced configuration options hidden behind "Advanced" toggles
- Creator Studio surfaces basic analytics; deep metrics require explicit drill-down
- Onboarding reveals features as users encounter them, not upfront
- Filter panels collapsed by default on mobile, expandable on demand

### 1.3 Instant Value (< 60 Seconds to First Run)

A new visitor must be able to discover a tool and execute it within 60 seconds
of landing. This is the North Star metric for the entire UX.

**How we achieve it:**
- Featured tools on landing page with one-click "Try Free" buttons
- Guest execution for free-tier tools (no signup required)
- Pre-filled sample inputs on tool detail pages
- Inline execution results (no page navigation required)
- Credit purchase flow completable in under 30 seconds

### 1.4 Trust Signals Everywhere

Software tool marketplaces live and die by trust. Every surface must reinforce
credibility and quality.

**Trust elements:**
- Star ratings (1-5, half-star granularity) displayed on every tool card
- Run count badges ("10K+ runs" with trending indicator)
- Creator verification badges (blue checkmark for verified creators)
- "Featured by Sotally" editorial badge
- User review snippets with verified purchase tags
- Response time and uptime indicators on tool detail pages
- Money-back guarantee badges on premium tools
- Security audit badges for tools handling sensitive data

### 1.5 Platform Pattern Inspirations

We draw from the best of proven marketplace and content platforms:

| Platform   | Pattern We Adopt                                    |
|------------|-----------------------------------------------------|
| **Fiverr** | Tool cards with creator avatar, price, rating       |
| **YouTube** | Content discovery grid, recommendation engine       |
| **Shopify** | Creator dashboard, earnings analytics               |
| **Stripe**  | Clean developer documentation, API playground       |
| **Notion**  | Workspace feel for Creator Studio, block-based UI   |
| **Gumroad** | Simple pricing display, instant purchase flow       |
| **Vercel**  | Deployment status, real-time streaming output       |

### 1.6 Consistency Over Novelty

Every interaction should feel predictable. Users should never wonder "what
happens if I click this?" Consistent patterns across all four user roles
reduce cognitive load and support role-switching (a creator is also a buyer).

### 1.7 Speed Is a Feature

Perceived performance matters as much as actual performance. Every interaction
should feel instant through optimistic UI updates, skeleton loading, and
progressive content rendering.

---

## 2. Design System

### 2.1 Color Palette

#### Primary Colors

```
Primary (Slate):
  50:  #F8FAFC    -- Page backgrounds, subtle fills
  100: #F1F5F9    -- Card backgrounds, alternating rows
  200: #E2E8F0    -- Borders, dividers
  300: #CBD5E1    -- Disabled states, placeholder text
  400: #94A3B8    -- Secondary text, icons
  500: #64748B    -- Body text (light mode)
  600: #475569    -- Strong secondary text
  700: #334155    -- Headings (light mode)
  800: #1E293B    -- High-emphasis text
  900: #0F172A    -- Primary brand color, nav backgrounds
  950: #020617    -- Maximum contrast, dark mode backgrounds
```

#### Accent Colors

```
Emerald (Primary Accent):
  50:  #ECFDF5    -- Success backgrounds
  100: #D1FAE5    -- Success badges light
  200: #A7F3D0    -- Hover fills
  300: #6EE7B7    -- Active states
  400: #34D399    -- Icons, progress bars
  500: #10B981    -- PRIMARY ACCENT — CTAs, links, active nav
  600: #059669    -- Hover state for primary buttons
  700: #047857    -- Pressed state
  800: #065F46    -- Dark mode accent
  900: #064E3B    -- Dark mode accent pressed
```

#### Semantic Colors

```
Warning (Amber):
  Light BG:  #FFFBEB
  Default:   #F59E0B
  Dark:      #B45309
  Use: Credit low warnings, pending states, review needed

Error (Red):
  Light BG:  #FEF2F2
  Default:   #EF4444
  Dark:      #B91C1C
  Use: Validation errors, failed executions, destructive actions

Success (Green):
  Light BG:  #F0FDF4
  Default:   #22C55E
  Dark:      #15803D
  Use: Successful runs, payment confirmed, tool published

Info (Blue):
  Light BG:  #EFF6FF
  Default:   #3B82F6
  Dark:      #1D4ED8
  Use: Tips, informational banners, help text

Purple (Creator/Premium):
  Light BG:  #FAF5FF
  Default:   #8B5CF6
  Dark:      #6D28D9
  Use: Creator badges, premium features, pro plans
```

#### Neutral Scale

```
White:       #FFFFFF
Gray-50:     #FAFAFA
Gray-100:    #F5F5F5
Gray-200:    #E5E5E5
Gray-300:    #D4D4D4
Gray-400:    #A3A3A3
Gray-500:    #737373
Gray-600:    #525252
Gray-700:    #404040
Gray-800:    #262626
Gray-900:    #171717
Black:       #000000
```

#### Dark Mode Mapping

| Element          | Light Mode | Dark Mode  |
|------------------|-----------|------------|
| Page Background  | #FFFFFF   | #020617    |
| Card Background  | #FFFFFF   | #0F172A    |
| Card Border      | #E2E8F0   | #1E293B    |
| Primary Text     | #0F172A   | #F8FAFC    |
| Secondary Text   | #64748B   | #94A3B8    |
| Accent           | #10B981   | #34D399    |
| Dividers         | #E2E8F0   | #334155    |

### 2.2 Typography

#### Font Families

```css
--font-sans: 'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

- **Inter** -- All UI text, headings, body copy, navigation, buttons
- **JetBrains Mono** -- Code blocks, API keys, tool IDs, terminal output,
  execution results, technical values

#### Type Scale

```
text-xs:   12px / 16px  (1rem line-height)   -- Captions, badges, timestamps
text-sm:   14px / 20px  (1.43 line-height)   -- Secondary text, helper text, table cells
text-base: 16px / 24px  (1.5 line-height)    -- Body text, form labels, buttons
text-lg:   18px / 28px  (1.56 line-height)   -- Card titles, section intros
text-xl:   20px / 28px  (1.4 line-height)    -- Page section headings
text-2xl:  24px / 32px  (1.33 line-height)   -- Page titles
text-3xl:  30px / 36px  (1.2 line-height)    -- Hero subheadings
text-4xl:  36px / 40px  (1.11 line-height)   -- Hero headings, landing page
text-5xl:  48px / 48px  (1.0 line-height)    -- Display (landing only)
```

#### Font Weights

```
font-normal:    400   -- Body text
font-medium:    500   -- Labels, nav items, button text
font-semibold:  600   -- Card titles, section headings
font-bold:      700   -- Page titles, hero text, emphasis
font-extrabold: 800   -- Landing page hero (display only)
```

#### Typography Rules

- Body text never below 16px on mobile (accessibility)
- Line length capped at 65-75 characters for readability
- Headings use tighter tracking (-0.025em for text-2xl and above)
- Monospace text always gets a subtle background (#F1F5F9 light, #1E293B dark)
- No underline on links except in body text paragraphs

### 2.3 Spacing System

#### Base Unit

```
Base: 4px

Spacing Scale:
  0.5:  2px    -- Micro spacing (icon-to-text tight)
  1:    4px    -- Minimum padding, tight groups
  1.5:  6px    -- Small badge padding
  2:    8px    -- Default gap, icon spacing
  3:    12px   -- Input padding-y, small card padding
  4:    16px   -- Default card padding, section gap
  5:    20px   -- Medium spacing
  6:    24px   -- Content sections within a card
  8:    32px   -- Between cards, major section spacing
  10:   40px   -- Page section spacing (mobile)
  12:   48px   -- Page section spacing (tablet)
  16:   64px   -- Page section spacing (desktop)
  20:   80px   -- Hero section padding
  24:   96px   -- Landing page section spacing
```

#### Grid

- 8px grid for all layout decisions
- 4px allowed only for micro-adjustments (icon alignment, badge padding)
- All component dimensions snap to 4px increments

#### Border Radius

```
rounded-sm:   4px    -- Badges, small tags
rounded:      6px    -- Buttons, inputs
rounded-md:   8px    -- Cards, dropdowns
rounded-lg:   12px   -- Modals, large cards
rounded-xl:   16px   -- Hero cards, featured sections
rounded-full: 9999px -- Avatars, pills, icon buttons
```

#### Shadows

```
shadow-sm:    0 1px 2px rgba(0,0,0,0.05)                        -- Subtle lift (badges)
shadow:       0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)  -- Cards at rest
shadow-md:    0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)  -- Cards on hover
shadow-lg:    0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) -- Modals, dropdowns
shadow-xl:    0 20px 25px rgba(0,0,0,0.1), 0 8px 10px rgba(0,0,0,0.04) -- Popovers
shadow-inner: inset 0 2px 4px rgba(0,0,0,0.06)                  -- Pressed states
```

### 2.4 Component Library

#### 2.4.1 Buttons

**Primary Button**
```
Background:    emerald-500 (#10B981)
Text:          white
Hover:         emerald-600 (#059669)
Active:        emerald-700 (#047857)
Disabled:      emerald-300 (#6EE7B7) + opacity 50%
Border Radius: 6px
Padding:       12px 24px (h-10)
Font:          text-sm font-medium
Transition:    150ms ease
Shadow:        shadow-sm on hover

Sizes:
  sm:  h-8  px-3  text-xs
  md:  h-10 px-4  text-sm   (default)
  lg:  h-12 px-6  text-base
  xl:  h-14 px-8  text-lg   (hero CTAs only)
```

**Secondary Button**
```
Background:    transparent
Border:        1px solid slate-200
Text:          slate-700
Hover BG:      slate-50
Hover Border:  slate-300
Active BG:     slate-100
```

**Ghost Button**
```
Background:    transparent
Border:        none
Text:          slate-600
Hover BG:      slate-100
Active BG:     slate-200
Use:           Toolbar actions, icon buttons, low-emphasis actions
```

**Destructive Button**
```
Background:    red-500
Text:          white
Hover:         red-600
Use:           Delete tool, cancel subscription, remove account
Always:        Requires confirmation modal
```

**Button with Icon**
```
Icon:          16px (sm), 18px (md), 20px (lg)
Gap:           8px between icon and label
Icon Position: Leading (default) or trailing (arrows, external links)
```

**Loading Button**
```
Shows spinner icon (16px) replacing leading icon
Text changes to action verb ("Running...", "Saving...", "Publishing...")
Pointer-events: none
Opacity: 80%
```

#### 2.4.2 Tool Card (Fiverr-Style)

The tool card is the atomic unit of the marketplace. It must convey maximum
information in minimum space while driving clicks.

```
+------------------------------------------+
|  [Tool Icon/Screenshot]                  |
|  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
|                                          |
|  [Category Tag]                          |
|  Tool Name That Can Be Two Lines         |
|  Maximum If Needed                       |
|                                          |
|  [Creator Avatar] Creator Name  [Badge]  |
|                                          |
|  +------+  +------------------+          |
|  | *4.8  |  | 12.4K runs      |          |
|  +------+  +------------------+          |
|                                          |
|  +------------------+  +-------------+   |
|  | From 2 credits   |  | [Run Tool]  |   |
|  +------------------+  +-------------+   |
+------------------------------------------+

Dimensions:
  Width:     100% of grid column (fluid)
  Min-width: 280px
  Max-width: 380px
  Padding:   16px

Thumbnail Area:
  Height:      180px (desktop), 140px (mobile)
  Background:  Gradient or tool screenshot
  Corner:      rounded-t-md (8px top corners)
  Overlay:     Category badge top-left, "Free" badge top-right if applicable

Content Area:
  Padding:     16px
  Gap:         8px between elements

Category Tag:
  Background:  emerald-50
  Text:        emerald-700
  Font:        text-xs font-medium
  Padding:     2px 8px
  Radius:      rounded-full

Tool Name:
  Font:        text-lg font-semibold slate-900
  Lines:       Max 2, truncate with ellipsis
  Line-height: 1.4

Creator Row:
  Avatar:      24px rounded-full
  Name:        text-sm font-medium slate-600
  Badge:       16px verified icon (blue) if verified

Rating:
  Stars:       text-xs, amber-400 fill, slate-200 empty
  Count:       text-xs slate-500 "(482)"

Run Count:
  Icon:        play-circle 14px
  Text:        text-xs slate-500
  Format:      "1.2K runs" / "10K+ runs"

Price:
  Font:        text-sm font-semibold slate-900
  Format:      "From X credits" or "Free" (emerald-500 text)
  Subscription: "X credits/mo" with small "subscription" tag

Hover State:
  Transform:   translateY(-2px)
  Shadow:      shadow-md
  Transition:  200ms ease
  Cursor:      pointer

Click Target:
  Entire card is clickable (wrapped in <a> or Next.js <Link>)
  Run button stops propagation (direct execution)
```

#### 2.4.3 Credit Badge (Navigation)

The credit badge is always visible in the top navigation bar. It is the
user's "wallet" and must be glanceable at all times.

```
+----------------------------+
|  [Coin Icon]  142 credits  |
+----------------------------+

States:
  Default:     slate-100 bg, slate-700 text, coin icon emerald-500
  Low (< 10):  amber-50 bg, amber-700 text, pulse animation
  Zero:        red-50 bg, red-600 text, "Add Credits" becomes primary CTA
  Adding:      Counter animates UP (spring physics, 300ms)
  Spending:    Counter animates DOWN with subtle bounce
  Loading:     Skeleton shimmer (40px wide)

Animation (on spend):
  1. Number decreases with counter animation (each digit rolls)
  2. Subtle scale bounce (1.0 -> 1.05 -> 1.0, 200ms)
  3. Brief emerald glow on the badge border
  4. If credits drop below 10: transition to amber warning state

Click Action:
  Opens credit purchase dropdown/modal

Position:
  Desktop: Top nav, right side, before user avatar
  Mobile:  Top nav, right side (compact: just icon + number)

Dimensions:
  Height:   36px
  Padding:  4px 12px
  Radius:   rounded-full
  Font:     text-sm font-semibold
  Icon:     18px
```

#### 2.4.4 Rating Stars Component

```
Display Modes:
  Static:      Read-only display (tool cards, detail page header)
  Interactive:  Clickable for submitting reviews

Sizes:
  sm:  14px star, text-xs  count   -- Tool cards, compact views
  md:  18px star, text-sm  count   -- Tool detail header, reviews
  lg:  24px star, text-base count  -- Review submission form

Colors:
  Filled:   amber-400 (#FBBF24)
  Half:     Linear gradient (amber-400 left, slate-200 right)
  Empty:    slate-200 (#E2E8F0)
  Hover:    amber-300 (#FCD34D) with scale 1.1

Display Format:
  Stars + numeric: "****- 4.8 (1,247 reviews)"
  Stars only:      "****-" (compact)
  Numeric only:    "4.8/5" (inline text)

Half-Star Rendering:
  Use SVG clip-path for precise half-fill
  Snap: 0, 0.5, 1.0 increments
  Display: round to nearest 0.1 for numeric

Interactive Behavior:
  Hover previews rating (filled stars up to cursor)
  Click confirms rating
  Can change rating by clicking different star
  Tooltip on hover: "Rate X out of 5"
```

#### 2.4.5 Pricing Badges

```
Per-Run Pricing:
  +------------------+
  |  2 credits/run   |
  +------------------+
  BG: slate-50, Border: slate-200
  Font: text-sm font-semibold

Free Tool:
  +----------+
  |   Free   |
  +----------+
  BG: emerald-50, Text: emerald-700
  Font: text-sm font-bold

Subscription:
  +-----------------------+
  |  10 credits/month     |
  |  Unlimited runs       |
  +-----------------------+
  BG: purple-50, Border: purple-200
  Text: purple-700
  Sub-text: text-xs slate-500

Tiered Pricing:
  +-------------------------+
  |  Basic: 1 credit/run    |
  |  Pro:   5 credits/run   |
  |  Ultra: 15 credits/run  |
  +-------------------------+
  Visual: Stacked rows with tier name left, price right
  Active tier highlighted with emerald left border

Bundle:
  +-----------------------------+
  |  50 credits for 3 credits   |
  |  SAVE 40%                   |
  +-----------------------------+
  BG: emerald-50
  Badge: "SAVE X%" in emerald-700 pill
```

#### 2.4.6 Form Inputs

```
Text Input:
  Height:      40px (h-10)
  Padding:     0 12px
  Border:      1px solid slate-200
  Radius:      6px (rounded)
  Font:        text-sm
  Placeholder: slate-400
  Focus:       border-emerald-500, ring-2 ring-emerald-500/20
  Error:       border-red-500, ring-2 ring-red-500/20
  Disabled:    bg-slate-50, text-slate-400, cursor-not-allowed

Textarea:
  Min-height:  80px
  Resize:      vertical only
  Same styles as text input

Select:
  Same base as text input
  Chevron icon right-aligned
  Uses shadcn/ui Select with portal dropdown

Checkbox / Radio:
  Size:      18px
  Checked:   emerald-500 fill
  Focus:     ring-2 ring-emerald-500/20
  Label:     text-sm, 8px gap

Toggle Switch:
  Width:  44px
  Height: 24px
  Track:  slate-200 (off), emerald-500 (on)
  Thumb:  white, shadow-sm
  Transition: 150ms ease

File Upload:
  Dashed border, slate-200
  Drop zone: "Drag & drop or click to upload"
  Icon: upload-cloud, 32px
  Accepted formats shown as small tags
  Progress bar on upload
```

#### 2.4.7 Modals

```
Overlay:     black/50 backdrop-blur-sm
Container:   white bg, rounded-lg, shadow-xl
Max-width:   sm (400px), md (500px), lg (600px), xl (800px), full (90vw)
Padding:     24px
Animation:   Scale from 95% + fade in, 200ms ease-out

Structure:
  +----------------------------------------+
  |  [X close]                             |
  |  Modal Title              text-xl bold |
  |  Optional description     text-sm      |
  |  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
  |                                        |
  |  [Content Area]                        |
  |                                        |
  |  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
  |           [Cancel]  [Confirm]          |
  +----------------------------------------+

Close triggers: X button, overlay click, Escape key
Focus trapped inside modal while open
First focusable element receives focus on open
Return focus to trigger element on close
```

#### 2.4.8 Tooltips

```
Background:  slate-900
Text:        white, text-xs
Padding:     4px 8px
Radius:      4px (rounded-sm)
Max-width:   200px
Arrow:       6px triangle matching background
Position:    Auto (top preferred, flips if needed)
Delay:       300ms show, 0ms hide
Animation:   Fade in + slight translate, 150ms

Mobile: Tooltips become tap-to-show with a small info icon
```

#### 2.4.9 Toast Notifications

```
Position:    Bottom-right (desktop), bottom-center (mobile)
Width:       360px max (desktop), calc(100vw - 32px) (mobile)
Padding:     16px
Radius:      8px (rounded-md)
Shadow:      shadow-lg
Animation:   Slide up + fade in, 300ms spring
Auto-dismiss: 5 seconds (configurable per type)
Max stack:   3 visible, older ones collapse

Variants:
  Success:  Emerald left border (3px), checkmark icon
  Error:    Red left border, x-circle icon, no auto-dismiss
  Warning:  Amber left border, alert-triangle icon
  Info:     Blue left border, info icon
  Loading:  Spinner icon, no auto-dismiss, updates in place

Structure:
  +--+--------------------------------------+--+
  |  | [Icon] Title                     [X] |  |
  |  |        Optional description          |  |
  |  |        [Action Button]               |  |
  +--+--------------------------------------+--+

Action buttons: text-only, small, primary color matching variant
Swipe-to-dismiss on mobile (right swipe)
```

---

## 3. Page Layouts

### 3.1 Landing Page

The entry point for all new visitors. Optimized for conversion to first tool run.

```
+================================================================+
|  [Logo]    Explore   Pricing   Creators    [Login] [Sign Up]   |
+================================================================+
|                                                                 |
|    Run powerful software tools                                  |
|    with just one click.                                         |
|                                                                 |
|    No setup. No coding. Pay per use.                            |
|                                                                 |
|    [Explore Tools]  [Start Creating ->]                         |
|                                                                 |
|    +--------------------------------------------------+        |
|    |                                                  |        |
|    |           [Hero Illustration / Demo]             |        |
|    |        Animated tool execution preview            |        |
|    |                                                  |        |
|    +--------------------------------------------------+        |
|                                                                 |
|    Trusted by 10,000+ users   |   50K+ tool runs   |   4.9*   |
|                                                                 |
+================================================================+
|                                                                 |
|    FEATURED TOOLS                             [View All ->]     |
|                                                                 |
|    +----------+  +----------+  +----------+  +----------+      |
|    |  Tool 1  |  |  Tool 2  |  |  Tool 3  |  |  Tool 4  |      |
|    |  Card    |  |  Card    |  |  Card    |  |  Card    |      |
|    |  (Full)  |  |  (Full)  |  |  (Full)  |  |  (Full)  |      |
|    +----------+  +----------+  +----------+  +----------+      |
|                                                                 |
+================================================================+
|                                                                 |
|    BROWSE BY CATEGORY                                           |
|                                                                 |
|    +--------+  +--------+  +--------+  +--------+              |
|    |  Dev   |  | Design |  |  Data  |  |  AI &  |              |
|    | Tools  |  | Tools  |  | Tools  |  |  ML    |              |
|    |  [24]  |  |  [18]  |  |  [31]  |  |  [42]  |              |
|    +--------+  +--------+  +--------+  +--------+              |
|    +--------+  +--------+  +--------+  +--------+              |
|    | Market |  | Content|  |  SEO   |  |  More  |              |
|    |  ing   |  |        |  |        |  |   ->   |              |
|    |  [15]  |  |  [22]  |  |  [19]  |  |        |              |
|    +--------+  +--------+  +--------+  +--------+              |
|                                                                 |
+================================================================+
|                                                                 |
|    HOW IT WORKS                                                 |
|                                                                 |
|    1. Find a Tool         2. Run It            3. Get Results   |
|    [Search icon]          [Play icon]          [Check icon]     |
|    Browse our             Enter your           Download or      |
|    marketplace of         inputs and hit       copy your        |
|    vetted tools.          run. That's it.      results instantly.|
|                                                                 |
+================================================================+
|                                                                 |
|    WHAT CREATORS ARE EARNING                                    |
|                                                                 |
|    +--------------------------------------------------+        |
|    |  "I made $2,400 in my first month selling        |        |
|    |   my PDF converter tool."                         |        |
|    |                                                  |        |
|    |   [Avatar] Sarah K. - Creator since 2025         |        |
|    +--------------------------------------------------+        |
|                                                                 |
|    +--------------------------------------------------+        |
|    |  "Sotally lets me monetize the scripts I was     |        |
|    |   giving away for free."                          |        |
|    |                                                  |        |
|    |   [Avatar] Marcus T. - Creator since 2025        |        |
|    +--------------------------------------------------+        |
|                                                                 |
|    [Start Selling Your Tools ->]                                |
|                                                                 |
+================================================================+
|                                                                 |
|    SOCIAL PROOF BAR                                             |
|                                                                 |
|    [Logo] [Logo] [Logo] [Logo] [Logo] [Logo]                   |
|    "Used by teams at..."                                        |
|                                                                 |
+================================================================+
|                                                                 |
|    READY TO GET STARTED?                                        |
|                                                                 |
|    [Create Free Account]     [Explore Marketplace]              |
|                                                                 |
+================================================================+
|                                                                 |
|    [Logo]   About  Pricing  Blog  Docs  Support                |
|             Terms  Privacy  Status                              |
|    (c) 2026 Sotally. All rights reserved.                      |
|                                                                 |
+================================================================+
```

### 3.2 Marketplace Browse

The primary discovery interface. Search, filter, and browse tools.

```
+================================================================+
|  [Logo]  [Search...........]  [Credits: 142]  [Avatar]         |
+================================================================+
|                                                                 |
|  MARKETPLACE                                     [Grid] [List] |
|                                                                 |
|  +------------------+  +-----------------------------------+   |
|  | FILTERS          |  |  Showing 247 tools                |   |
|  |                  |  |  Sort: [Most Popular v]            |   |
|  | Category         |  |                                   |   |
|  | [ ] Dev Tools    |  |  +----------+  +----------+       |   |
|  | [ ] Design       |  |  |  Tool    |  |  Tool    |       |   |
|  | [ ] Data         |  |  |  Card    |  |  Card    |       |   |
|  | [ ] AI & ML      |  |  |          |  |          |       |   |
|  | [ ] Marketing    |  |  +----------+  +----------+       |   |
|  | [Show more]      |  |                                   |   |
|  |                  |  |  +----------+  +----------+       |   |
|  | Price Range      |  |  |  Tool    |  |  Tool    |       |   |
|  | [0]----[50]      |  |  |  Card    |  |  Card    |       |   |
|  |                  |  |  |          |  |          |       |   |
|  | Rating           |  |  +----------+  +----------+       |   |
|  | ( ) 4+ stars     |  |                                   |   |
|  | ( ) 3+ stars     |  |  +----------+  +----------+       |   |
|  | ( ) Any          |  |  |  Tool    |  |  Tool    |       |   |
|  |                  |  |  |  Card    |  |  Card    |       |   |
|  | Pricing Model    |  |  |          |  |          |       |   |
|  | [ ] Free         |  |  +----------+  +----------+       |   |
|  | [ ] Per-run      |  |                                   |   |
|  | [ ] Subscription |  |  [Load More] or infinite scroll   |   |
|  |                  |  |                                   |   |
|  | Sort By          |  +-----------------------------------+   |
|  | ( ) Popular      |                                          |
|  | ( ) Newest       |                                          |
|  | ( ) Top Rated    |                                          |
|  | ( ) Price: Low   |                                          |
|  | ( ) Price: High  |                                          |
|  |                  |                                          |
|  | [Clear Filters]  |                                          |
|  +------------------+                                          |
|                                                                 |
+================================================================+

Mobile: Filters in a bottom sheet triggered by a "Filters" button.
        Tool grid becomes single column.
        Search bar is sticky at top.

Search Features:
  - Instant search with debounce (300ms)
  - Search suggestions dropdown (recent, popular, categories)
  - Search by tool name, description, creator name, category
  - URL reflects search/filter state (shareable URLs)
  - "No results" state with helpful suggestions
```

### 3.3 Tool Detail Page

**This is the most important page in the entire application.** Every element
must drive toward one goal: the user clicks "Run Tool."

```
+================================================================+
|  [Logo]  [Search...........]  [Credits: 142]  [Avatar]         |
+================================================================+
|                                                                 |
|  Marketplace > Data Tools > CSV Analyzer Pro                    |
|                                                                 |
+================================================================+
|                                                                 |
|  +----------------------------------------------------+        |
|  |                                                    |        |
|  |  [Tool Icon]                                       |        |
|  |                                                    |        |
|  |  CSV Analyzer Pro                                  |        |
|  |  Analyze and visualize CSV data instantly           |        |
|  |                                                    |        |
|  |  [Avatar] by DataWiz  [Verified Badge]             |        |
|  |                                                    |        |
|  |  ****- 4.8 (1,247 reviews)   |   43.2K runs       |        |
|  |                                                    |        |
|  |  +------------+  +----------+  +----------+        |        |
|  |  | 3 credits  |  | [heart]  |  | [share]  |        |        |
|  |  |  per run   |  | Save     |  | Share    |        |        |
|  |  +------------+  +----------+  +----------+        |        |
|  |                                                    |        |
|  +----------------------------------------------------+        |
|                                                                 |
+================================================================+
|                                                                 |
|  +----------------------------------------------------+        |
|  |  RUN THIS TOOL                                     |        |
|  |                                                    |        |
|  |  Upload CSV File *                                 |        |
|  |  +--------------------------------------------+   |        |
|  |  |  [Upload icon]                             |   |        |
|  |  |  Drag & drop or click to upload            |   |        |
|  |  |  .csv files up to 10MB                     |   |        |
|  |  +--------------------------------------------+   |        |
|  |                                                    |        |
|  |  Analysis Type *                                   |        |
|  |  [Summary Statistics     v]                        |        |
|  |                                                    |        |
|  |  Output Format                                     |        |
|  |  ( ) Table  ( ) Chart  (*) Both                    |        |
|  |                                                    |        |
|  |  [  Try with Sample Data  ]   [  Run Tool (3cr) ] |        |
|  |                                                    |        |
|  +----------------------------------------------------+        |
|                                                                 |
+================================================================+
|                                                                 |
|  SAMPLE OUTPUT                                                  |
|                                                                 |
|  +----------------------------------------------------+        |
|  |  +------+-------+--------+-------+                 |        |
|  |  | Col  | Mean  | Median | StdDev|                 |        |
|  |  +------+-------+--------+-------+                 |        |
|  |  | Age  | 34.2  | 32.0   | 8.7   |                 |        |
|  |  | Sal  | 65.1K | 58.0K  | 22.3K |                 |        |
|  |  +------+-------+--------+-------+                 |        |
|  |                                                    |        |
|  |  [Chart visualization preview]                     |        |
|  |                                                    |        |
|  |  This is sample output. Run the tool to see your   |        |
|  |  own results.                                      |        |
|  +----------------------------------------------------+        |
|                                                                 |
+================================================================+
|                                                                 |
|  [About]  [Reviews (1,247)]  [Changelog]  [API]                |
|                                                                 |
|  ABOUT THIS TOOL                                                |
|  CSV Analyzer Pro takes any CSV file and produces               |
|  comprehensive statistical analysis including summary           |
|  statistics, correlation matrices, and distribution             |
|  charts. Supports files up to 10MB with unlimited columns.     |
|                                                                 |
|  Features:                                                      |
|  - Automatic column type detection                             |
|  - Missing value analysis                                      |
|  - Outlier detection                                           |
|  - Export to PDF/PNG                                           |
|                                                                 |
|  Tags: [csv] [data] [analytics] [statistics] [visualization]  |
|                                                                 |
+================================================================+
|                                                                 |
|  REVIEWS                                      [Write Review]   |
|                                                                 |
|  Rating Distribution:                                           |
|  5* ==================== 78%                                   |
|  4* ======= 15%                                               |
|  3* == 4%                                                      |
|  2* = 2%                                                       |
|  1* = 1%                                                       |
|                                                                 |
|  +----------------------------------------------------+        |
|  |  ***** "Exactly what I needed"                     |        |
|  |  This tool saved me hours of work. The output      |        |
|  |  was clean and accurate. Highly recommended.       |        |
|  |  - Alex M. | Verified Purchase | 2 days ago        |        |
|  |  [Helpful (24)]  [Report]                          |        |
|  +----------------------------------------------------+        |
|                                                                 |
|  +----------------------------------------------------+        |
|  |  ****  "Great but could use more chart types"      |        |
|  |  Overall excellent tool. Would love to see          |        |
|  |  scatter plots added in a future update.            |        |
|  |  - Jamie L. | Verified Purchase | 1 week ago       |        |
|  |  [Helpful (12)]  [Report]                          |        |
|  +----------------------------------------------------+        |
|                                                                 |
|  [Show More Reviews]                                            |
|                                                                 |
+================================================================+
|                                                                 |
|  SIMILAR TOOLS                                                  |
|                                                                 |
|  +----------+  +----------+  +----------+  +----------+       |
|  |  Tool    |  |  Tool    |  |  Tool    |  |  Tool    |       |
|  |  Card    |  |  Card    |  |  Card    |  |  Card    |       |
|  +----------+  +----------+  +----------+  +----------+       |
|                                                                 |
+================================================================+
|                                                                 |
|  CREATOR INFO                                                   |
|  +----------------------------------------------------+        |
|  |  [Large Avatar]                                    |        |
|  |  DataWiz  [Verified]                               |        |
|  |  "Building tools that make data accessible"         |        |
|  |  12 tools | 4.9 avg rating | 180K total runs       |        |
|  |  [View Profile]  [Follow]                          |        |
|  +----------------------------------------------------+        |
|                                                                 |
+================================================================+

Mobile Layout Adjustments:
  - Input form moves to top (above description/reviews)
  - "Run Tool" button becomes sticky bottom bar
  - Sample output collapsible by default
  - Reviews show 2 initially with "Show More"
  - Similar tools horizontal scroll
  - Tabs become scrollable horizontal pills
```

### 3.4 Execution Result Page

Shown after a tool run completes. Provides streaming output with progressive
rendering.

```
+================================================================+
|  [Logo]  [Search...........]  [Credits: 139]  [Avatar]         |
+================================================================+
|                                                                 |
|  < Back to CSV Analyzer Pro                                     |
|                                                                 |
|  EXECUTION RESULT                                               |
|  Run #4,821  |  Started 12s ago  |  Status: Streaming...       |
|                                                                 |
+================================================================+
|                                                                 |
|  +----------------------------------------------------+        |
|  |  PROGRESS                                          |        |
|  |  [=============================        ] 72%       |        |
|  |                                                    |        |
|  |  Step 1: File uploaded           [check]           |        |
|  |  Step 2: Parsing columns         [check]           |        |
|  |  Step 3: Running analysis        [spinner]         |        |
|  |  Step 4: Generating charts       [pending]         |        |
|  |  Step 5: Compiling report        [pending]         |        |
|  +----------------------------------------------------+        |
|                                                                 |
+================================================================+
|                                                                 |
|  OUTPUT                                                         |
|                                                                 |
|  +----------------------------------------------------+        |
|  |  [Results render here progressively as they stream] |        |
|  |                                                    |        |
|  |  Summary Statistics:                               |        |
|  |  +------+-------+--------+-------+------+         |        |
|  |  | Col  | Mean  | Median | StdDev| Null |         |        |
|  |  +------+-------+--------+-------+------+         |        |
|  |  | Age  | 34.2  | 32.0   | 8.7   | 0    |         |        |
|  |  | Sal  | 65.1K | 58.0K  | 22.3K | 3    |         |        |
|  |  | Exp  | 7.3   | 6.0    | 4.1   | 0    |         |        |
|  |  +------+-------+--------+-------+------+         |        |
|  |                                                    |        |
|  |  [Distribution chart rendering...]                 |        |
|  |                                                    |        |
|  +----------------------------------------------------+        |
|                                                                 |
+================================================================+
|                                                                 |
|  ACTIONS                                                        |
|                                                                 |
|  [Copy Results]  [Download PDF]  [Download CSV]  [Share]       |
|                                                                 |
|  +----------------------------------------------------+        |
|  |  Enjoyed this tool?                                |        |
|  |  [Rate This Run: * * * * *]                        |        |
|  |  [Run Again with New Input]  [Browse More Tools]   |        |
|  +----------------------------------------------------+        |
|                                                                 |
+================================================================+
|                                                                 |
|  EXECUTION LOG (collapsed by default)                           |
|  [> Show execution log]                                         |
|                                                                 |
|  +----------------------------------------------------+        |
|  |  12:03:41.123  File received: data.csv (2.4MB)     |        |
|  |  12:03:41.456  Detected 12 columns, 10,482 rows    |        |
|  |  12:03:42.789  Analysis complete                    |        |
|  |  12:03:43.012  Charts generated (3 of 3)           |        |
|  +----------------------------------------------------+        |
|                                                                 |
+================================================================+

Streaming Behavior:
  - Output area uses Server-Sent Events (SSE)
  - Content renders progressively (no full-page refresh)
  - Progress bar updates in real-time
  - Steps transition: pending -> running (spinner) -> complete (check)
  - If error: step turns red with error message inline
  - User can navigate away and return (execution persists)

Failed Execution:
  - Red status badge "Failed"
  - Error message in friendly language
  - Technical details in collapsible section
  - [Retry] button with same inputs
  - Credits refunded automatically (shown in toast)
```

### 3.5 Buyer Dashboard

The buyer's home base after login.

```
+================================================================+
|  [Logo]  [Search...........]  [Credits: 142]  [Avatar]         |
+================================================================+
|                                                                 |
|  +----------+                                                   |
|  | SIDEBAR  |  DASHBOARD                                        |
|  |          |                                                   |
|  | Overview |  Welcome back, Shubh!                             |
|  | History  |                                                   |
|  | Favorites|  +------------+  +------------+  +------------+  |
|  | Subscrip.|  | Credits    |  | Tools Run  |  | This Month |  |
|  | Settings |  | 142        |  | 847        |  | 23 runs    |  |
|  |          |  | [Add More] |  | All time   |  | -12% vs    |  |
|  |          |  +------------+  +------------+  | last month |  |
|  |          |                                  +------------+  |
|  |          |                                                   |
|  |          |  RECENT RUNS                       [View All ->] |
|  |          |                                                   |
|  |          |  +------+------------------+------+------+       |
|  |          |  | Tool | Input            | Date | Cost |       |
|  |          |  +------+------------------+------+------+       |
|  |          |  | CSV  | data_march.csv   | 2h   | 3 cr |       |
|  |          |  | PDF  | report_v2.pdf    | 1d   | 2 cr |       |
|  |          |  | IMG  | banner.png       | 3d   | 1 cr |       |
|  |          |  +------+------------------+------+------+       |
|  |          |                                                   |
|  |          |  FAVORITE TOOLS                    [View All ->] |
|  |          |                                                   |
|  |          |  +----------+  +----------+  +----------+        |
|  |          |  |  Tool    |  |  Tool    |  |  Tool    |        |
|  |          |  |  Card    |  |  Card    |  |  Card    |        |
|  |          |  | (compact)|  | (compact)|  | (compact)|        |
|  |          |  +----------+  +----------+  +----------+        |
|  |          |                                                   |
|  |          |  ACTIVE SUBSCRIPTIONS                             |
|  |          |                                                   |
|  |          |  +--------------------------------------------+  |
|  |          |  | CSV Analyzer Pro   | 10 cr/mo | Renews 4/1 |  |
|  |          |  | Image Optimizer    | 5 cr/mo  | Renews 4/8 |  |
|  |          |  +--------------------------------------------+  |
|  |          |                                                   |
|  |          |  RECOMMENDED FOR YOU                              |
|  |          |                                                   |
|  |          |  +----------+  +----------+  +----------+        |
|  |          |  |  Tool    |  |  Tool    |  |  Tool    |        |
|  |          |  |  Card    |  |  Card    |  |  Card    |        |
|  |          |  +----------+  +----------+  +----------+        |
|  +----------+                                                   |
|                                                                 |
+================================================================+

Mobile: Sidebar becomes bottom tab bar (Dashboard, History, Favorites, More)
        Stats cards stack vertically
        Recent runs as a simplified list
```

### 3.6 Creator Studio

The creator's command center for managing tools, earnings, and analytics.

```
+================================================================+
|  [Logo]  [Search...........]  [Credits: 142]  [Avatar]         |
+================================================================+
|                                                                 |
|  +----------+                                                   |
|  | SIDEBAR  |  CREATOR STUDIO                                   |
|  |          |                                                   |
|  | Overview |  +------------+  +------------+  +------------+  |
|  | My Tools |  | Earnings   |  | Total Runs |  | Avg Rating |  |
|  | Analytics|  | $2,847     |  | 180.4K     |  | 4.9 *****  |  |
|  | Payouts  |  | This month |  | All time   |  | 12 tools   |  |
|  | Settings |  | +22% [up]  |  | +8% [up]   |  |            |  |
|  |          |  +------------+  +------------+  +------------+  |
|  |          |                                                   |
|  |          |  +--------------------------------------------+  |
|  |          |  |  [+ Create New Tool]                        | |
|  |          |  |  Start from scratch or use a template       | |
|  |          |  +--------------------------------------------+  |
|  |          |                                                   |
|  |          |  MY TOOLS                          [View All ->] |
|  |          |                                                   |
|  |          |  +--------------------------------------------+  |
|  |          |  | Tool Name   | Status | Runs  | Earn | Rate |  |
|  |          |  +-------------+--------+-------+------+------+  |
|  |          |  | CSV Analyzer| Live   | 43.2K | $1.2K| 4.8  |  |
|  |          |  | PDF Convert | Live   | 28.1K | $840 | 4.7  |  |
|  |          |  | Image Opt   | Live   | 12.8K | $320 | 4.9  |  |
|  |          |  | JSON Format | Review | --    | --   | --   |  |
|  |          |  | XML Parser  | Draft  | --    | --   | --   |  |
|  |          |  +-------------+--------+-------+------+------+  |
|  |          |                                                   |
|  |          |  EARNINGS CHART                                   |
|  |          |                                                   |
|  |          |  $3K |                         ..                 |
|  |          |  $2K |              ...........  ..               |
|  |          |  $1K |  .....------'                              |
|  |          |   $0 +--+--+--+--+--+--+--+--+--+--+--+--+     |
|  |          |       J  F  M  A  M  J  J  A  S  O  N  D        |
|  |          |                                                   |
|  |          |  RECENT REVIEWS                                   |
|  |          |                                                   |
|  |          |  ***** "Love this tool!" - 2h ago                |
|  |          |  ****  "Works great, needs more options" - 1d    |
|  |          |  ***** "Best CSV tool on the platform" - 2d      |
|  |          |                                                   |
|  +----------+                                                   |
|                                                                 |
+================================================================+

Status Badges:
  Live:     emerald-100 bg, emerald-700 text, green dot
  Review:   amber-100 bg, amber-700 text, clock icon
  Draft:    slate-100 bg, slate-500 text, pencil icon
  Rejected: red-100 bg, red-700 text, x icon
  Paused:   purple-100 bg, purple-700 text, pause icon
```

### 3.7 Tool Builder (7-Step Wizard)

The guided tool creation experience for creators.

```
+================================================================+
|  [Logo]          Tool Builder          [Save Draft] [Exit]     |
+================================================================+
|                                                                 |
|  Step 3 of 7: Define Inputs                                    |
|  [=====|=====|=====|     |     |     |     ]                   |
|   Info   Code  Inputs  Output  Price  Test  Publish             |
|                                                                 |
+================================================================+
|                                                                 |
|  +------------------------------+  +------------------------+  |
|  | DEFINE INPUT FIELDS          |  | LIVE PREVIEW           |  |
|  |                              |  |                        |  |
|  | Input #1                     |  | +--------------------+ |  |
|  | Label: [CSV File           ] |  | | CSV File *         | |  |
|  | Type:  [File Upload      v]  |  | | [Upload area]      | |  |
|  | Required: [x]               |  | |                    | |  |
|  | Help Text: [Upload your...] |  | | Analysis Type *    | |  |
|  | File Types: [.csv, .tsv   ] |  | | [Dropdown v]       | |  |
|  | Max Size: [10 ] MB          |  | |                    | |  |
|  |                              |  | | [Run Tool (3 cr)]  | |  |
|  | [+ Add Validation Rule]     |  | +--------------------+ |  |
|  |                              |  |                        |  |
|  | ---                          |  | This preview updates   |  |
|  |                              |  | in real-time as you    |  |
|  | Input #2                     |  | configure inputs.      |  |
|  | Label: [Analysis Type     ] |  |                        |  |
|  | Type:  [Dropdown         v]  |  |                        |  |
|  | Options:                     |  |                        |  |
|  |   - Summary Statistics       |  |                        |  |
|  |   - Correlation Matrix       |  |                        |  |
|  |   - Distribution Analysis    |  |                        |  |
|  | [+ Add Option]              |  |                        |  |
|  |                              |  |                        |  |
|  | [+ Add Another Input]       |  |                        |  |
|  |                              |  |                        |  |
|  +------------------------------+  +------------------------+  |
|                                                                 |
|  [< Back: Upload Code]         [Next: Configure Output >]     |
|                                                                 |
+================================================================+

7 Steps:
  1. Basic Info     -- Name, description, category, tags, icon
  2. Upload Code    -- Code upload or inline editor, runtime selection
  3. Define Inputs  -- Input fields the buyer fills out (shown above)
  4. Configure Output -- Output format, preview template
  5. Set Pricing    -- Per-run credits, subscription option, free tier
  6. Test & Preview -- Run with sample data, verify output
  7. Publish        -- Review summary, terms acceptance, submit

Wizard Behavior:
  - Steps are sequential but users can jump back to completed steps
  - Current step highlighted in progress bar
  - Auto-save on every field change (debounced 2s)
  - "Save Draft" always available
  - Validation on step transition (can't proceed with errors)
  - Preview panel updates in real-time on steps 3-6
  - Mobile: Preview panel moves below the form
```

### 3.8 Affiliate Dashboard

```
+================================================================+
|  [Logo]  [Search...........]  [Credits: 142]  [Avatar]         |
+================================================================+
|                                                                 |
|  +----------+                                                   |
|  | SIDEBAR  |  AFFILIATE DASHBOARD                              |
|  |          |                                                   |
|  | Overview |  +------------+  +------------+  +------------+  |
|  | Links    |  | Earnings   |  | Referrals  |  | Conversion |  |
|  | Referrals|  | $487       |  | 142        |  | 8.3%       |  |
|  | Materials|  | This month |  | This month |  | Rate       |  |
|  | Payouts  |  | +34% [up]  |  | +12% [up]  |  | +1.2% [up]|  |
|  | Settings |  +------------+  +------------+  +------------+  |
|  |          |                                                   |
|  |          |  YOUR REFERRAL LINK                               |
|  |          |  +--------------------------------------------+  |
|  |          |  | sotally.com/?ref=shubh123                   |  |
|  |          |  | [Copy Link] [Generate New] [QR Code]        |  |
|  |          |  +--------------------------------------------+  |
|  |          |                                                   |
|  |          |  TOOL-SPECIFIC LINKS                              |
|  |          |  +--------------------------------------------+  |
|  |          |  | CSV Analyzer - sotally.com/t/csv?ref=...    |  |
|  |          |  | [Copy] | 48 clicks | 12 signups | $89 earn |  |
|  |          |  +--------------------------------------------+  |
|  |          |  | PDF Convert - sotally.com/t/pdf?ref=...     |  |
|  |          |  | [Copy] | 31 clicks | 8 signups  | $42 earn |  |
|  |          |  +--------------------------------------------+  |
|  |          |                                                   |
|  |          |  EARNINGS OVER TIME                               |
|  |          |                                                   |
|  |          |  $500|                              .             |
|  |          |  $300|              ....----''''''''              |
|  |          |  $100|  ...--------'                              |
|  |          |    $0+--+--+--+--+--+--+--+--+--+--+            |
|  |          |      Jan Feb Mar Apr May Jun Jul Aug              |
|  |          |                                                   |
|  |          |  REFERRAL ACTIVITY                                |
|  |          |                                                   |
|  |          |  +--------------------------------------------+  |
|  |          |  | User   | Signed Up | Credits | Your Earn   |  |
|  |          |  +--------+-----------+---------+-------------+  |
|  |          |  | alex@  | Mar 12    | 50 cr   | $4.50       |  |
|  |          |  | jane@  | Mar 10    | 100 cr  | $9.00       |  |
|  |          |  | mark@  | Mar 8     | 25 cr   | $2.25       |  |
|  |          |  +--------+-----------+---------+-------------+  |
|  |          |                                                   |
|  |          |  MARKETING MATERIALS                              |
|  |          |                                                   |
|  |          |  [Banner 728x90]  [Banner 300x250]               |
|  |          |  [Social Cards]   [Email Templates]              |
|  |          |  [Brand Assets]   [Copy Snippets]                |
|  |          |                                                   |
|  +----------+                                                   |
|                                                                 |
+================================================================+
```

### 3.9 Admin Dashboard

```
+================================================================+
|  [Logo]        ADMIN PANEL        [Notifications] [Avatar]     |
+================================================================+
|                                                                 |
|  +----------+                                                   |
|  | SIDEBAR  |  ADMIN OVERVIEW                                   |
|  |          |                                                   |
|  | Overview |  +--------+  +--------+  +--------+  +--------+ |
|  | Users    |  | Users  |  | Tools  |  | Revenue|  | Runs   | |
|  | Tools    |  | 12.4K  |  | 487    |  | $48.2K |  | 284K   | |
|  | Review Q |  | +8%    |  | +12    |  | +22%   |  | +15%   | |
|  | Reports  |  | /month |  | /week  |  | /month |  | /month | |
|  | Revenue  |  +--------+  +--------+  +--------+  +--------+ |
|  | Settings |                                                   |
|  | Logs     |  REVIEW QUEUE (7 pending)          [View All ->] |
|  |          |                                                   |
|  |          |  +--------------------------------------------+  |
|  |          |  | Tool Name      | Creator  | Submit | Action|  |
|  |          |  +----------------+----------+--------+-------+  |
|  |          |  | JSON Formatter | @devpro  | 2h ago | [Rev] |  |
|  |          |  | Image Resize   | @imgwiz  | 5h ago | [Rev] |  |
|  |          |  | Text Analyzer  | @nlpguy  | 1d ago | [Rev] |  |
|  |          |  +----------------+----------+--------+-------+  |
|  |          |                                                   |
|  |          |  PLATFORM METRICS                                 |
|  |          |                                                   |
|  |          |  Daily Active Users    Runs per Day               |
|  |          |  +------------------+  +------------------+      |
|  |          |  |    /\    /\      |  |        /\        |      |
|  |          |  |   /  \  /  \  /  |  |   /\  /  \      |      |
|  |          |  |  /    \/    \/   |  |  /  \/    \  /  |      |
|  |          |  | /                |  | /          \/   |      |
|  |          |  +------------------+  +------------------+      |
|  |          |                                                   |
|  |          |  RECENT REPORTS                                   |
|  |          |                                                   |
|  |          |  [!] Tool "Fast PDF" flagged - malicious output  |
|  |          |  [!] User @spammer - multiple fake reviews       |
|  |          |  [i] Creator @datawiz - payout request $1,200    |
|  |          |                                                   |
|  |          |  SYSTEM HEALTH                                    |
|  |          |                                                   |
|  |          |  API Uptime: 99.97%  |  Avg Response: 142ms      |
|  |          |  Queue Depth: 3      |  Error Rate: 0.02%        |
|  |          |                                                   |
|  +----------+                                                   |
|                                                                 |
+================================================================+

Admin Color Accent:
  Admin-specific elements use a distinct red/orange accent to visually
  differentiate admin views from user-facing pages.
  Admin accent: #DC2626 (red-600) for action items and alerts
```

---

## 4. User Flows

### 4.1 First-Time Buyer Flow

**Goal:** Land on site, discover a tool, execute it, experience value, buy credits.

```
STEP 1: LANDING
  User arrives at sotally.com (via search, ad, referral, or direct)
  |
  v
STEP 2: DISCOVERY
  Option A: Click a featured tool on the landing page
  Option B: Use search bar to find a specific tool
  Option C: Browse by category
  |
  v
STEP 3: TOOL DETAIL
  User views tool detail page:
  - Reads name, description, rating, run count
  - Sees pricing (e.g., "3 credits per run")
  - Notices "Try with Sample Data" button (FREE, no signup)
  |
  v
STEP 4: SAMPLE RUN (no auth required)
  User clicks "Try with Sample Data"
  - Tool runs with pre-loaded sample inputs
  - Streaming output shows real results
  - User sees the value of the tool firsthand
  |
  v
STEP 5: SIGNUP PROMPT
  User wants to run with their own data
  - Modal: "Create a free account to run tools"
  - Options: Email/password, Google OAuth, GitHub OAuth
  - Signup takes < 30 seconds
  - NEW: User gets 5 free credits on signup
  |
  v
STEP 6: INTEREST SELECTION (optional, skippable)
  After signup, lightweight interest picker:
  - "What do you use tools for?"
  - 6-8 category cards, multi-select
  - "Skip" link clearly visible
  - Used to personalize recommendations
  |
  v
STEP 7: FIRST REAL RUN
  Redirected back to tool detail page
  - Credit balance shows "5 credits" (welcome bonus)
  - User uploads their own file / enters their own inputs
  - Clicks "Run Tool (3 credits)"
  |
  v
STEP 8: RESULT + DELIGHT
  Execution result page:
  - Streaming output shows progress
  - Results render in real-time
  - Success state with confetti animation (first-ever run)
  - Toast: "Your first tool run! You have 2 credits remaining."
  |
  v
STEP 9: CREDIT PURCHASE PROMPT
  After credits run low (< 3 remaining):
  - Subtle banner: "Running low on credits?"
  - One-click purchase options: 25 cr ($5), 100 cr ($15), 500 cr ($50)
  - Stripe Checkout integration (< 30s to complete)
  |
  v
STEP 10: RETENTION HOOKS
  - Email: "Your tool results are ready" (if they left before completion)
  - Email: "Tools similar to ones you've run" (D+3)
  - Dashboard: Personalized recommendations based on run history
```

**Conversion Metrics:**
- Landing -> Tool View: target 40%+
- Tool View -> Sample Run: target 25%+
- Sample Run -> Signup: target 35%+
- Signup -> First Paid Run: target 50%+
- First Paid Run -> Credit Purchase: target 30%+

### 4.2 Returning Buyer Flow

**Goal:** Quick path from login to running a favorite tool.

```
STEP 1: LOGIN
  User visits sotally.com or app
  - Auto-redirect to dashboard if session exists
  - If no session: login form (email/OAuth)
  - "Remember me" checked by default
  |
  v
STEP 2: DASHBOARD
  Buyer Dashboard loads:
  - Credit balance prominently displayed
  - "Recent Runs" section shows last 5 executions
  - "Favorite Tools" section shows saved tools
  - "Recommended" shows personalized suggestions
  |
  v
STEP 3: TOOL SELECTION
  Option A: Click favorite tool directly from dashboard
  Option B: Re-run a recent execution (pre-filled inputs)
  Option C: Search for a new tool
  |
  v
STEP 4: EXECUTION
  Tool detail page (already familiar):
  - Previous inputs may be pre-filled ("Run again with same settings")
  - One-click "Run Tool" if inputs are pre-filled
  |
  v
STEP 5: RESULT
  Results page
  - Download/copy/share actions
  - "Run Again" button for iterative use
```

**Time Target:** Login to execution result in under 45 seconds.

### 4.3 Creator: First Tool Flow

**Goal:** A creator publishes their first tool on the marketplace.

```
STEP 1: CREATOR STUDIO
  User navigates to Creator Studio
  - If first visit: Welcome modal with "Create Your First Tool" CTA
  - If returning: Dashboard with "+ Create New Tool" button
  |
  v
STEP 2: TEMPLATE SELECTION
  "How would you like to start?"
  - Start from scratch
  - Use a template:
    * File Converter (upload → process → download)
    * Data Analyzer (input data → analysis → report)
    * Text Processor (text in → text out)
    * Image Tool (image in → processed image out)
    * API Wrapper (parameters → API call → formatted result)
  - Import existing script (upload .py, .js, .ts)
  |
  v
STEP 3: TOOL BUILDER WIZARD (7 steps)

  Step 1: Basic Info
  - Tool name (unique, 3-60 chars)
  - Short description (max 160 chars, shown on cards)
  - Long description (Markdown, shown on detail page)
  - Category (select from taxonomy)
  - Tags (up to 5, autocomplete)
  - Tool icon (upload or select from library)
  |
  v
  Step 2: Upload Code
  - Drag & drop code file or paste inline
  - Select runtime: Python 3.11, Node.js 20, Deno, Go 1.22
  - Dependencies: requirements.txt / package.json (auto-detected)
  - Environment variables (secrets stored securely)
  - Execution timeout setting (5s - 300s)
  |
  v
  Step 3: Define Inputs (see wireframe in 3.7)
  - Add input fields with type, label, validation
  - Supported types: text, number, file, dropdown, checkbox, date, JSON
  - Set required/optional, default values, help text
  - Live preview updates on the right
  |
  v
  Step 4: Configure Output
  - Output type: text, JSON, file, image, HTML, table
  - Output preview template
  - Download format options for buyers
  - Sample output (required, shown on tool detail page)
  |
  v
  Step 5: Set Pricing
  - Per-run: X credits (min 1, max 100)
  - Subscription: X credits/month for unlimited runs
  - Free tier: first N runs free (optional)
  - Tiered: different credit costs for different input sizes/options
  - Price recommendation based on similar tools
  |
  v
  Step 6: Test & Preview
  - Run tool with sample inputs
  - Verify output matches expectations
  - Preview how tool card looks in marketplace
  - Preview how tool detail page looks
  - Must pass at least one successful test run to proceed
  |
  v
  Step 7: Publish
  - Review summary of all settings
  - Accept Creator Terms of Service
  - Choose: Submit for Review or Save as Draft
  - Submit triggers admin review process
  |
  v
STEP 4: REVIEW PERIOD
  - Tool enters "Under Review" status
  - Creator receives email confirmation
  - Admin reviews within 24-48 hours
  - Notification on approval/rejection with feedback
  |
  v
STEP 5: LIVE
  - Tool appears in marketplace
  - Creator sees first run notifications
  - Analytics start tracking
  - Earnings accrue from first paid run
```

### 4.4 Affiliate Signup Flow

**Goal:** New affiliate applies, gets approved, starts earning referral income.

```
STEP 1: APPLICATION
  User visits sotally.com/affiliates (linked from footer, marketing pages)
  - Landing page: "Earn 15% on every credit purchase from your referrals"
  - Stats: "Average affiliate earns $X/month"
  - [Apply Now] CTA
  |
  v
STEP 2: APPLICATION FORM
  - Must have existing Sotally account (signup if needed)
  - Promotion method: Blog, YouTube, Social Media, Newsletter, Other
  - Audience size estimate
  - Website/channel URL
  - Why they want to be an affiliate (short text)
  - Accept Affiliate Terms
  - [Submit Application]
  |
  v
STEP 3: REVIEW
  - Application enters admin queue
  - Applicant receives email: "Application received, reviewing within 48h"
  - Admin reviews: audience quality, promotion method, platform fit
  |
  v
STEP 4: APPROVAL
  - Email notification: "Welcome to the Sotally Affiliate Program!"
  - Affiliate Dashboard unlocked in navigation
  - Unique referral link generated: sotally.com/?ref=USERNAME
  |
  v
STEP 5: GET LINK
  Affiliate visits dashboard:
  - Copy main referral link
  - Generate tool-specific links for higher conversion
  - Generate QR code for offline promotion
  - Customize link slug (premium feature)
  |
  v
STEP 6: SHARE
  Affiliate promotes using provided materials:
  - Banner ads in multiple sizes
  - Social media card templates
  - Email copy templates
  - Video intro/outro templates
  - "Powered by Sotally" badges
  |
  v
STEP 7: TRACK
  Dashboard shows real-time analytics:
  - Link clicks (by link, by day, by source)
  - Signups from referral
  - Credit purchases from referred users
  - Commission earned (15% of credit purchases)
  - Pending vs. cleared earnings
  - Payout history and upcoming payout date

  Cookie Duration: 30 days
  Attribution: Last-click, 30-day window
  Payout: Monthly, minimum $50, via PayPal or bank transfer
```

---

## 5. Responsive Breakpoints

### 5.1 Breakpoint Definitions

```
Mobile:    320px  - 767px    (sm: 640px sub-breakpoint)
Tablet:    768px  - 1023px   (md)
Desktop:   1024px - 1439px   (lg: 1024px, xl: 1280px)
Large:     1440px+           (2xl)

Tailwind config:
  screens: {
    'sm':  '640px',
    'md':  '768px',
    'lg':  '1024px',
    'xl':  '1280px',
    '2xl': '1440px',
  }
```

### 5.2 Mobile (320px - 767px)

**Layout:**
- Single column for all content
- Full-width cards, no horizontal padding below 16px
- Stacked form elements (labels above inputs)
- Content max-width: 100% with 16px side padding

**Navigation:**
- Top bar: Logo (left), Credit Badge compact (right), Hamburger (right)
- Bottom tab bar for authenticated users:
  - Home | Browse | [+ Run] | Activity | Profile
  - Center "Run" button is prominent (emerald, slightly raised)
  - Active tab: emerald icon + text, inactive: slate-400 icon only
- Hamburger opens full-screen nav overlay (slide from right)

**Tool Cards:**
- Single column, full width
- Thumbnail height reduced to 140px
- Horizontal scroll for "Similar Tools" and "Featured" sections
- Swipe gestures for card carousels

**Tool Detail Page:**
- Input form positioned ABOVE description (run first, read later)
- "Run Tool" button is sticky at bottom of viewport (60px height)
- Sample output collapsed behind "View Sample" toggle
- Reviews show 2 initially
- Tabs become horizontally scrollable pills

**Dashboard:**
- Sidebar becomes bottom tab bar
- Stats cards stack vertically (full width)
- Tables switch to card-based list layout
- Charts full width, reduced height

**Forms:**
- Single column, full width inputs
- Touch-friendly: all inputs 44px+ height
- File upload: full-width drop zone
- Select dropdowns use native mobile select on iOS/Android

**Typography Adjustments:**
- Hero: text-3xl (not text-5xl)
- Page titles: text-xl (not text-2xl)
- Body: text-base (never below 16px)

### 5.3 Tablet (768px - 1023px)

**Layout:**
- 2-column grid for tool cards
- Sidebar collapses to icons-only (expandable on hover/click)
- Content area gets more breathing room (24px side padding)

**Navigation:**
- Top bar expands: Logo, Search (expandable), main nav links, Credit Badge, Avatar
- No bottom tab bar (enough horizontal space for top nav)
- Sidebar: icon-only mode (48px wide), expands to full on hover (240px)

**Tool Cards:**
- 2-column grid
- Card max-width: none (fills column)
- Thumbnail: 160px height

**Tool Detail Page:**
- Input form and description side by side (60/40 split) on wider tablets
- Similar tools: 2-column grid (not horizontal scroll)

**Dashboard:**
- Stats cards: 2 per row (3rd wraps or stretches)
- Tables: show all columns but with tighter padding
- Sidebar: collapsible, defaults to collapsed

### 5.4 Desktop (1024px - 1439px)

**Layout:**
- 3-column grid for tool cards in marketplace
- Full sidebar (240px) for dashboards
- Content area: remaining width with 32px padding

**Navigation:**
- Full horizontal nav bar:
  Logo | Search bar (400px) | Explore | Pricing | Creators | [Credit Badge] | [Avatar + dropdown]
- No hamburger, no bottom bar
- Sidebar: always visible in dashboard views

**Tool Cards:**
- 3-column grid (sometimes 2 with sidebar present)
- Card max-width: 380px
- Full hover effects enabled (lift + shadow)

**Tool Detail Page:**
- Two-column layout: Main content (65%) | Sidebar (35%)
- Sidebar contains: pricing card, creator info, similar tools
- Input form in main content area
- All sections visible (no collapsing)
- Sticky "Run Tool" card in sidebar (scrolls with page)

**Dashboard:**
- Full sidebar with labels
- Stats: 3-4 per row
- Tables: full columns, comfortable spacing
- Charts: side by side where appropriate

### 5.5 Large Desktop (1440px+)

**Layout:**
- Max-width container: 1440px, centered with auto margins
- Increased whitespace between sections (64px+)
- Larger typography for hero/landing sections
- 4-column grid for tool cards on landing page

**Navigation:**
- Same as desktop, more spacious
- Search bar wider (500px+)

**Tool Cards:**
- 4-column grid on landing/marketplace (no sidebar)
- 3-column with sidebar present

**Tool Detail Page:**
- Generous padding and whitespace
- Content area capped at comfortable reading width (720px)
- Sidebar gets more whitespace

**Dashboard:**
- Stats: 4 per row comfortably
- Charts: larger, more detail visible
- Tables: relaxed spacing, hover rows

### 5.6 Touch vs. Pointer Interactions

```css
/* Hover only on pointer devices */
@media (hover: hover) and (pointer: fine) {
  .tool-card:hover { transform: translateY(-2px); }
  .button:hover { background-color: var(--hover-bg); }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  /* Larger hit targets */
  .button { min-height: 44px; }
  .nav-item { padding: 12px 16px; }
  /* No hover effects; use active states */
  .tool-card:active { transform: scale(0.98); }
}
```

---

## 6. Interaction Patterns

### 6.1 Loading States

**Skeleton Loading (preferred over spinners)**

All content areas use skeleton placeholders that match the shape of the
content they replace:

```
Tool Card Skeleton:
  +------------------------------------------+
  |  [##################################]    |  <- thumbnail (pulsing gray)
  |  [#########]                             |  <- category tag
  |  [#####################]                 |  <- title line 1
  |  [#############]                         |  <- title line 2
  |  [##] [###########]                      |  <- avatar + name
  |  [#####]  [########]                     |  <- rating + runs
  |  [########]  [##########]               |  <- price + button
  +------------------------------------------+

Skeleton Animation:
  Background: linear-gradient shimmer effect
  Direction: left to right
  Duration: 1.5s infinite
  Colors: slate-200 base, slate-100 shimmer highlight
```

**When to use spinners instead:**
- Inline actions (button loading state)
- Small, bounded areas (saving indicator)
- Short waits (< 500ms)

**Loading Hierarchy:**
1. **Instant (0-100ms):** No loading indicator needed
2. **Brief (100-300ms):** Subtle opacity change on content area
3. **Short (300ms-1s):** Skeleton placeholders appear
4. **Medium (1-5s):** Skeleton + "Loading..." text
5. **Long (5s+):** Skeleton + progress indicator + estimated time

### 6.2 Empty States

Every content area that can be empty must have a designed empty state.

```
Pattern:
  +----------------------------------------------------+
  |                                                    |
  |            [Illustration / Icon]                   |
  |            (64-96px, slate-300)                    |
  |                                                    |
  |            Heading (what's empty)                  |
  |            Body (why and what to do)               |
  |                                                    |
  |            [Primary CTA Button]                    |
  |                                                    |
  +----------------------------------------------------+

Examples:

  No Favorite Tools:
    Icon: Heart outline (64px)
    Heading: "No favorites yet"
    Body: "Save tools you love for quick access later."
    CTA: [Browse Marketplace]

  No Runs:
    Icon: Play circle outline (64px)
    Heading: "You haven't run any tools yet"
    Body: "Find a tool that fits your workflow and give it a try."
    CTA: [Explore Tools]

  Creator - No Tools:
    Icon: Package outline (64px)
    Heading: "Create your first tool"
    Body: "Turn your code into a product. It takes less than 10 minutes."
    CTA: [+ Create Tool]

  No Search Results:
    Icon: Search outline (64px)
    Heading: "No tools match your search"
    Body: "Try adjusting your filters or search terms."
    CTA: [Clear Filters]
    Secondary: "Popular right now: [Tool] [Tool] [Tool]"

  No Reviews:
    Icon: Message circle outline (64px)
    Heading: "No reviews yet"
    Body: "Be the first to share your experience with this tool."
    CTA: [Write a Review]
```

### 6.3 Error States

```
Inline Form Errors:
  - Red border on input (border-red-500)
  - Red helper text below input: "Email is required"
  - Icon: exclamation circle (16px, red-500) left of message
  - Announced to screen readers via aria-live="polite"

Page-Level Errors:
  +----------------------------------------------------+
  |  [Warning Icon] Something went wrong               |
  |                                                    |
  |  We couldn't load your dashboard. This is usually  |
  |  temporary.                                        |
  |                                                    |
  |  [Try Again]  [Contact Support]                    |
  +----------------------------------------------------+
  Background: red-50 (light), border-left: 3px red-500

Execution Errors:
  +----------------------------------------------------+
  |  [X Circle Icon] Tool execution failed             |
  |                                                    |
  |  The tool encountered an error while processing    |
  |  your input.                                       |
  |                                                    |
  |  Error: File format not supported. Expected .csv   |
  |  but received .xlsx                                |
  |                                                    |
  |  [> View Technical Details]                        |
  |                                                    |
  |  [Retry with Same Input]  [Edit Input & Retry]    |
  |                                                    |
  |  Your 3 credits have been refunded.                |
  +----------------------------------------------------+

Network Errors:
  - Banner at top of page: "You appear to be offline. Changes will sync when you reconnect."
  - Non-blocking: user can still view cached content
  - Auto-retry with exponential backoff
  - Toast when connection restored: "Back online. Syncing..."

404 Page:
  +----------------------------------------------------+
  |  [Illustration: lost in space]                     |
  |                                                    |
  |  Page not found                                    |
  |  The page you're looking for doesn't exist or      |
  |  has been moved.                                   |
  |                                                    |
  |  [Go to Homepage]  [Browse Marketplace]            |
  +----------------------------------------------------+
```

### 6.4 Success States

```
Tool Execution Complete:
  - Green checkmark animation (Lottie, 300ms)
  - Progress bar fills to 100% and turns emerald-500
  - All step indicators show green checkmarks
  - Results area scrolls into view smoothly

First-Ever Tool Run:
  - Confetti animation from top of viewport (2s duration)
  - Toast: "Congratulations on your first tool run!"
  - Subtle: do not block content, animation purely decorative

Tool Published:
  - Full-page success state with confetti
  - "Your tool is live!" with link to tool page
  - Share buttons for social media
  - "What's next?" suggestions

Credit Purchase:
  - Animated credit counter rolls up to new balance
  - Green flash on credit badge
  - Toast: "Added 100 credits to your account"

Milestone Achievements:
  - 100 runs: "Century Club" badge + confetti
  - 1000 runs: "Power User" badge + confetti
  - First $100 earned (creator): celebration modal
  - These are non-blocking celebrations, easily dismissable
```

### 6.5 Micro-Animations

```
Credit Balance Counter:
  - Digits roll individually (slot machine style)
  - Duration: 300ms per digit change
  - Easing: spring(1, 80, 10) via Framer Motion
  - Scale pulse: 1.0 -> 1.05 -> 1.0 on change
  - Color flash: brief emerald glow on increase, amber on decrease

Card Hover Lift:
  - Transform: translateY(-2px)
  - Shadow: shadow -> shadow-md
  - Duration: 200ms
  - Easing: ease-out
  - Only on pointer devices (@media hover: hover)

Rating Star Fill:
  - Each star fills left-to-right with 50ms stagger
  - Fill color: scale from slate-200 to amber-400
  - Slight scale up on fill (1.0 -> 1.15 -> 1.0)
  - Duration: 200ms per star

Button Press:
  - Active: scale(0.97) for 100ms
  - Release: spring back to scale(1.0)

Page Transitions:
  - Fade in: opacity 0 -> 1, 200ms
  - Slide up: translateY(8px) -> 0, 200ms
  - Stagger children: 50ms delay per child element

Tab Switch:
  - Underline slides smoothly to new tab (300ms ease)
  - Content crossfade: old fades out (150ms), new fades in (150ms)

Toggle Switch:
  - Thumb slides: 200ms spring
  - Track color transitions: 200ms ease
  - Thumb scale: slight bulge at midpoint (1.0 -> 1.1 -> 1.0)

Progress Bar:
  - Width transitions smoothly (no jumps)
  - Color transitions: slate-200 -> emerald-400 as it fills
  - At 100%: brief pulse animation
  - Striped animation while actively progressing
```

### 6.6 Toast Notification Behavior

```
Appearance:
  - Slides up from bottom-right (desktop) or bottom-center (mobile)
  - Spring animation: slight overshoot then settle
  - Duration: 300ms entrance, 200ms exit

Stacking:
  - Max 3 visible simultaneously
  - New toasts push older ones up
  - 4th toast causes oldest to exit
  - 8px gap between stacked toasts

Auto-Dismiss:
  - Success: 5 seconds
  - Info: 5 seconds
  - Warning: 8 seconds
  - Error: No auto-dismiss (must be manually closed)
  - Loading: No auto-dismiss (replaced by success/error when complete)

Interaction:
  - Hover pauses auto-dismiss timer (desktop)
  - Click X to dismiss
  - Swipe right to dismiss (mobile)
  - Click action button (e.g., "Undo", "View") dismisses and navigates

Accessibility:
  - role="alert" for errors and warnings
  - role="status" for success and info
  - aria-live="polite" for non-urgent
  - aria-live="assertive" for errors
```

---

## 7. Accessibility

### 7.1 Standards Compliance

**Target: WCAG 2.1 Level AA**

All pages must pass automated accessibility testing (axe-core) with zero
violations at AA level before deployment.

### 7.2 Color Contrast

```
Normal Text (< 24px / < 18.66px bold):
  Minimum contrast ratio: 4.5:1

Large Text (>= 24px / >= 18.66px bold):
  Minimum contrast ratio: 3:1

UI Components and Graphics:
  Minimum contrast ratio: 3:1

Verified Combinations (Light Mode):
  slate-900 on white:      15.4:1  PASS AAA
  slate-700 on white:      9.2:1   PASS AAA
  slate-600 on white:      6.4:1   PASS AA
  slate-500 on white:      4.6:1   PASS AA
  emerald-500 on white:    3.4:1   PASS (large text only)
  emerald-700 on white:    5.8:1   PASS AA
  white on emerald-500:    3.4:1   PASS (large text / UI components)
  white on emerald-600:    4.5:1   PASS AA
  white on slate-900:      15.4:1  PASS AAA

Verified Combinations (Dark Mode):
  slate-50 on slate-950:   18.1:1  PASS AAA
  slate-200 on slate-950:  13.6:1  PASS AAA
  slate-400 on slate-950:  6.8:1   PASS AA
  emerald-400 on slate-950: 8.2:1  PASS AA

Note: emerald-500 on white does NOT meet 4.5:1 for normal text.
Use emerald-600 (#059669) for text on white backgrounds.
Use emerald-500 only for large text, icons, or UI components.
```

### 7.3 Keyboard Navigation

```
Tab Order:
  - Logical, follows visual layout (left-to-right, top-to-bottom)
  - Skip-to-content link as first focusable element
  - Focus moves through: nav items -> main content -> sidebar -> footer
  - Within forms: label -> input -> helper text -> next field
  - Modal: focus trapped inside, Tab cycles through modal elements

Focus Indicators:
  - 2px solid emerald-500 outline
  - 2px offset from element edge
  - Works on all interactive elements: buttons, links, inputs, cards
  - Custom focus-visible styles (only show on keyboard navigation)
  - box-shadow: 0 0 0 2px white, 0 0 0 4px #10B981
    (white inner ring prevents color collision)

Keyboard Shortcuts:
  Global:
    /         Focus search bar
    Escape    Close modal/dropdown/overlay
    ?         Open keyboard shortcuts help

  Marketplace:
    j/k       Navigate between tool cards (down/up)
    Enter     Open focused tool card
    f         Toggle favorite on focused card

  Tool Detail:
    r         Focus "Run Tool" button
    Tab       Move between input fields

  Dashboard:
    g then h  Go to Home/Dashboard
    g then m  Go to Marketplace
    g then s  Go to Settings

  All shortcuts shown in a help modal (triggered by ?)
```

### 7.4 Screen Reader Support

```
Semantic HTML:
  - <header>, <nav>, <main>, <aside>, <footer> landmarks
  - <h1> through <h6> in proper hierarchy (one <h1> per page)
  - <button> for actions, <a> for navigation
  - <ul>/<ol>/<li> for lists
  - <table> with <caption>, <thead>, <th scope> for data tables
  - <form> with <fieldset> and <legend> for form groups

ARIA Labels:
  - All icon-only buttons: aria-label="Close", aria-label="Favorite"
  - Navigation landmarks: aria-label="Main navigation"
  - Search: role="search"
  - Tool cards: aria-label="CSV Analyzer Pro by DataWiz, 4.8 stars, 3 credits per run"
  - Rating display: aria-label="4.8 out of 5 stars based on 1247 reviews"
  - Credit badge: aria-label="Credit balance: 142 credits"
  - Loading skeletons: aria-hidden="true" (content announced when loaded)
  - Decorative images: aria-hidden="true" or alt=""

Dynamic Content Announcements:
  - Tool execution progress: aria-live="polite" on status updates
  - Credit balance changes: aria-live="polite"
  - Toast notifications: aria-live="polite" (info/success), aria-live="assertive" (errors)
  - Form validation errors: aria-describedby linking error to input
  - Search results count: "Showing 247 tools" announced on filter change
  - Page transitions: document.title updated for screen reader announcement

Form Accessibility:
  - Every input has a visible <label> with for/id association
  - Required fields: aria-required="true" + visual asterisk
  - Error messages: aria-describedby on the input, pointing to error div
  - Error div: role="alert" for immediate announcement
  - Help text: aria-describedby on the input, pointing to help div
  - Group related inputs with <fieldset> + <legend>
```

### 7.5 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all non-essential animations */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Keep functional transitions that convey state */
  .progress-bar {
    /* Width change still visible, just instant */
  }

  /* No confetti, card lifts, counter animations */
  /* Loading skeletons: solid color instead of shimmer */
  .skeleton {
    animation: none;
    background: var(--slate-200);
  }
}
```

### 7.6 Additional Accessibility Considerations

```
Text Sizing:
  - All text uses rem/em units (never px for font-size)
  - Layout does not break at 200% browser zoom
  - Content reflows at 400% zoom (no horizontal scroll)

Touch Targets:
  - Minimum 44x44px for all interactive elements
  - 8px minimum spacing between adjacent touch targets
  - No overlapping hit areas

Color Independence:
  - Color is never the ONLY indicator of state
  - Errors: red color + icon + text message
  - Success: green color + checkmark icon + text
  - Required fields: color + asterisk
  - Active tab: color + underline + font weight

Content:
  - Language attribute on <html> element: lang="en"
  - Meaningful link text (never "click here")
  - Alt text on all informational images
  - Captions on video content (when added)
  - Reading level: aim for Grade 8 (Flesch-Kincaid)

Focus Management:
  - Modal open: focus moves to modal
  - Modal close: focus returns to trigger
  - Delete action: focus moves to next item in list
  - Page navigation: focus moves to main content area
  - Toast: does NOT steal focus (announced via aria-live)
```

---

## 8. Performance Targets

### 8.1 Core Web Vitals

```
First Contentful Paint (FCP):     < 1.5 seconds
Largest Contentful Paint (LCP):   < 2.5 seconds
Time to Interactive (TTI):        < 3.5 seconds
Cumulative Layout Shift (CLS):    < 0.1
First Input Delay (FID):          < 100ms
Interaction to Next Paint (INP):  < 200ms

Measurement:
  - Lighthouse CI in GitHub Actions (block merge if scores drop)
  - Real User Monitoring (RUM) via Vercel Analytics or equivalent
  - Synthetic monitoring: daily Lighthouse runs on key pages
  - Target Lighthouse score: 90+ on all categories
```

### 8.2 Bundle Size Budgets

```
JavaScript:
  Initial bundle (first load):     < 200 KB (gzipped)
  Per-route chunk:                 < 50 KB (gzipped)
  Total JS (all routes):          < 500 KB (gzipped)

  Critical path JS:               < 100 KB (gzipped)
    - React runtime
    - Router
    - Auth state
    - Layout shell
    - Navigation

  Lazy-loaded:
    - Tool builder wizard
    - Rich text editor (Markdown)
    - Chart rendering library
    - Admin dashboard
    - Affiliate dashboard

CSS:
  Total CSS:                       < 50 KB (gzipped)
  Tailwind: purge unused classes in production
  No CSS-in-JS (Tailwind utility classes only)

Fonts:
  Inter Variable:                  ~100 KB (subset to Latin)
  JetBrains Mono:                  ~50 KB (subset to Latin + programming symbols)
  Strategy: preload critical weight (400, 600), lazy-load others
```

### 8.3 Image Optimization

```
Formats:
  Primary:   WebP (85% quality for photos, lossless for UI)
  Fallback:  AVIF (for browsers that support it, 20-30% smaller)
  Legacy:    JPEG/PNG only as last resort

Loading Strategy:
  Above-the-fold:   eager loading, priority hint
  Below-the-fold:   lazy loading (loading="lazy")
  Tool thumbnails:  lazy loading with IntersectionObserver
  Avatars:          lazy loading, 48px placeholder blur

Sizes:
  Tool thumbnail:   400x225 (16:9 aspect ratio)
  Tool icon:        128x128 (1:1, used at 48-64px display)
  Creator avatar:   256x256 (1:1, used at 24-48px display)
  Hero image:       1920x1080 max, responsive srcset

Next.js Image Component:
  - Use next/image for all images
  - Automatic WebP/AVIF conversion
  - Responsive srcset generation
  - Blur placeholder for all images (base64 inline)
  - Specify width and height to prevent CLS
```

### 8.4 Font Loading Strategy

```html
<!-- Preload critical font files -->
<link rel="preload" href="/fonts/inter-var-latin.woff2"
      as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/jetbrains-mono-var-latin.woff2"
      as="font" type="font/woff2" crossorigin>
```

```css
/* Font declarations with display swap */
@font-face {
  font-family: 'Inter Variable';
  src: url('/fonts/inter-var-latin.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC,
                 U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074,
                 U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
                 U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono-var-latin.woff2') format('woff2');
  font-weight: 100 800;
  font-display: swap;
}
```

**Loading sequence:**
1. System font stack renders immediately (no FOUT flash)
2. Inter Variable loads and swaps in (< 100ms on fast connections)
3. JetBrains Mono loads on demand (only needed on tool detail/result pages)

### 8.5 Rendering Strategy

```
Server-Side Rendered (SSR) pages:
  - Landing page (SEO critical, first impression)
  - Marketplace browse (SEO: tool listings must be indexable)
  - Tool detail pages (SEO: individual tool pages are key search targets)
  - Creator profile pages (SEO)
  - Blog / documentation pages (SEO)
  - Pricing page (SEO)

  Why: Search engine indexability, faster FCP, social media previews (OG tags)
  How: Next.js App Router with server components as default

Static Generation (SSG) where possible:
  - Landing page (revalidate every 1 hour for featured tools)
  - Category pages (revalidate every 30 minutes)
  - Blog posts (revalidate on publish)
  - Pricing page (revalidate on plan changes)

  Why: Fastest possible load times, CDN-cacheable
  How: Next.js generateStaticParams + ISR (Incremental Static Regeneration)

Client-Side Rendered (CSR) pages:
  - Buyer Dashboard (personalized, requires auth)
  - Creator Studio (personalized, requires auth)
  - Tool Builder wizard (highly interactive, complex state)
  - Affiliate Dashboard (personalized, requires auth)
  - Admin Dashboard (internal, no SEO need)
  - Execution Result page (real-time streaming)
  - Settings / Account pages

  Why: Highly interactive, user-specific data, no SEO need
  How: Client components with SWR/React Query for data fetching

Streaming SSR:
  - Tool detail page: shell SSR'd, reviews/similar tools stream in
  - Marketplace: shell + first 12 tools SSR'd, rest loaded on scroll
  - React Suspense boundaries for progressive hydration
```

### 8.6 Caching Strategy

```
CDN (Edge):
  - Static assets: 1 year (cache-busted by content hash)
  - SSG pages: revalidate per ISR config
  - API responses: varies by endpoint

Browser Cache:
  - Fonts: 1 year (immutable)
  - Images: 1 year (content-hashed filenames)
  - JS/CSS chunks: 1 year (content-hashed)
  - HTML: no-cache (always revalidate)

API Caching:
  - Tool listings: SWR with 60s stale time
  - Tool detail: SWR with 30s stale time
  - User dashboard data: SWR with 10s stale time
  - Credit balance: real-time (no cache, WebSocket or short poll)
  - Execution results: cache indefinitely (immutable once complete)
  - Search results: SWR with 30s stale time

Prefetching:
  - Next.js Link: prefetch on viewport entry (default)
  - Tool cards: prefetch tool detail on hover (200ms delay)
  - Dashboard: prefetch likely next pages based on navigation patterns
  - Search: prefetch top 3 results on keystroke
```

### 8.7 Performance Monitoring

```
Build-Time:
  - Bundle analyzer: track bundle size changes per PR
  - Lighthouse CI: run on every PR, fail if score drops below 85
  - Type checking: ensure no type errors that could cause runtime issues

Runtime:
  - Vercel Analytics: Core Web Vitals from real users
  - Error tracking: Sentry for JS errors, source maps uploaded
  - API monitoring: response time p50/p95/p99
  - Custom metrics:
    * Time to first tool card render (marketplace)
    * Time from "Run Tool" click to first output (execution)
    * Credit badge update latency
    * Search results render time

Alerting:
  - LCP > 4s for 5% of users: warning
  - LCP > 6s for 5% of users: critical
  - JS error rate > 1%: warning
  - API p95 > 2s: warning
  - API p99 > 5s: critical
```

### 8.8 Network Optimization

```
HTTP/2 or HTTP/3:
  - Multiplexed connections for parallel asset loading
  - Server push for critical CSS/JS (if supported)

Compression:
  - Brotli compression for all text assets (HTML, CSS, JS, JSON)
  - Gzip fallback for older clients
  - Target: 70-80% compression ratio

DNS:
  - Preconnect to critical origins:
    <link rel="preconnect" href="https://api.sotally.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://cdn.sotally.com">

API:
  - GraphQL or tRPC for efficient data fetching (no over-fetching)
  - Pagination: cursor-based, 20 items default
  - Compression: gzip on all API responses
  - Connection pooling for database queries
```

---

## Appendix A: Design Token Reference

All design tokens are defined in Tailwind config and exported as CSS custom
properties for use in any context.

```css
:root {
  /* Colors */
  --color-primary: #0F172A;
  --color-accent: #10B981;
  --color-accent-hover: #059669;
  --color-accent-active: #047857;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-success: #22C55E;
  --color-info: #3B82F6;

  /* Typography */
  --font-sans: 'Inter Variable', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --space-unit: 4px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* Transitions */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);

  /* Z-Index Scale */
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
  --z-toast: 80;
}
```

## Appendix B: Component Inventory

A complete list of components needed for the design system, organized by
category. Each component should be built using shadcn/ui as the base where
possible, customized to match the Sotally design system.

### Layout Components
- `AppShell` -- Main layout wrapper (nav + sidebar + content)
- `NavBar` -- Top navigation bar
- `BottomNav` -- Mobile bottom tab navigation
- `Sidebar` -- Dashboard sidebar navigation
- `PageHeader` -- Page title + breadcrumbs + actions
- `Container` -- Max-width content wrapper
- `Grid` -- Responsive grid layout
- `Stack` -- Vertical spacing component

### Data Display
- `ToolCard` -- Marketplace tool card (Fiverr-style)
- `ToolCardSkeleton` -- Loading skeleton for tool card
- `ToolCardCompact` -- Smaller card variant for lists/favorites
- `CreditBadge` -- Animated credit balance display
- `RatingStars` -- Star rating display (static + interactive)
- `PricingBadge` -- Price display (per-run, subscription, free, tiered)
- `StatusBadge` -- Tool status indicator (live, review, draft, etc.)
- `RunCount` -- Formatted run count with icon
- `CreatorInfo` -- Avatar + name + verified badge
- `StatCard` -- Dashboard metric card with trend
- `DataTable` -- Sortable, paginated table
- `Chart` -- Line/bar/pie chart wrapper
- `EmptyState` -- Empty state illustration + CTA
- `Avatar` -- User avatar with fallback initials
- `Badge` -- Generic badge/tag component

### Forms
- `TextInput` -- Standard text input with label + error
- `TextArea` -- Multi-line text input
- `Select` -- Dropdown select
- `Checkbox` -- Checkbox with label
- `Radio` -- Radio button group
- `Toggle` -- Switch toggle
- `FileUpload` -- Drag-and-drop file upload zone
- `Slider` -- Range slider (price filter)
- `SearchInput` -- Search with icon, clear button, suggestions
- `CreditAmountInput` -- Specialized input for credit values

### Feedback
- `Toast` -- Toast notification (success, error, warning, info, loading)
- `Modal` -- Dialog/modal component
- `ConfirmModal` -- Destructive action confirmation
- `Tooltip` -- Hover/tap tooltip
- `ProgressBar` -- Linear progress indicator
- `Spinner` -- Loading spinner (small, inline)
- `Skeleton` -- Content loading skeleton
- `Confetti` -- Celebration animation component
- `Alert` -- Inline alert banner

### Navigation
- `Breadcrumb` -- Page breadcrumb trail
- `Tabs` -- Tab navigation with animated underline
- `Pagination` -- Page navigation for lists
- `StepWizard` -- Multi-step wizard progress indicator
- `FilterPanel` -- Marketplace filter sidebar/sheet

### Actions
- `Button` -- All button variants (primary, secondary, ghost, destructive)
- `IconButton` -- Icon-only button with tooltip
- `ButtonGroup` -- Grouped buttons
- `CopyButton` -- Click-to-copy with feedback
- `ShareButton` -- Share via link/social/QR
- `FavoriteButton` -- Heart toggle with animation

---

## Appendix C: Page-to-Component Mapping

| Page                | Key Components Used                                                    |
|---------------------|------------------------------------------------------------------------|
| Landing             | NavBar, ToolCard, StatCard, Button, Container                          |
| Marketplace Browse  | NavBar, SearchInput, FilterPanel, ToolCard, ToolCardSkeleton, Grid     |
| Tool Detail         | NavBar, RatingStars, PricingBadge, CreatorInfo, FileUpload, Button     |
| Execution Result    | ProgressBar, DataTable, CopyButton, Toast, RatingStars                 |
| Buyer Dashboard     | Sidebar, StatCard, ToolCardCompact, DataTable, CreditBadge             |
| Creator Studio      | Sidebar, StatCard, DataTable, StatusBadge, Chart, Button               |
| Tool Builder        | StepWizard, TextInput, Select, FileUpload, Toggle, Button, ToolCard    |
| Affiliate Dashboard | Sidebar, StatCard, CopyButton, DataTable, Chart                       |
| Admin Dashboard     | Sidebar, StatCard, DataTable, StatusBadge, Chart, Alert                |

---

*End of UI/UX Design Specification*
*Document maintained by the Sotally product and engineering team.*
