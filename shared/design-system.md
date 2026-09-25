# ExamSphere - Unified Design System & Visual Language

This document specifies the shared visual design tokens, color palette, typography hierarchy, component styles, and layout guidelines for both **Web Frontend** and **Mobile App** to ensure 100% visual consistency across devices.

---

## 🎨 1. Color Palette

### Primary Brand
- `primary-50`: `#EFF6FF` (Surface tint, active tab highlight)
- `primary-100`: `#DBEAFE` (Subtle selection badges)
- `primary-500`: `#3B82F6` (Interactive hover/focus states)
- `primary-600`: `#2563EB` **[Brand Primary]** (CTA buttons, primary headers, brand logos)
- `primary-700`: `#1D4ED8` (Active button press, strong accents)
- `primary-900`: `#1E3A8A` (Deep contrast text)

### Neutral Slate (Backgrounds, Borders & Typography)
- `slate-50`: `#F8FAFC` **[App Background]**
- `slate-100`: `#F1F5F9` **[Card inner background, Skeleton placeholder]**
- `slate-200`: `#E2E8F0` **[Primary Border Color, Dividers]**
- `slate-300`: `#CBD5E1` (Input borders, inactive radio indicators)
- `slate-400`: `#94A3B8` (Placeholders, subtle icons)
- `slate-500`: `#64748B` (Secondary captions, metadata labels)
- `slate-600`: `#475569` (Form labels, readable body secondary)
- `slate-700`: `#334155` (Subheadings, table content)
- `slate-800`: `#1E293B` (Headings, dark cards)
- `slate-900`: `#0F172A` **[Primary Heading Color, Code Editor Canvas]**

### Status & Feedback
- **Success (Passed, Correct Answer)**:
  - Background: `#DCFCE7` (`emerald-100`)
  - Border: `#BBF7D0` (`emerald-200`)
  - Foreground: `#16A34A` (`emerald-600`)
  - Text Dark: `#15803D` (`emerald-700`)
- **Warning (Approaching Timer, Incomplete Fields)**:
  - Background: `#FEF3C7` (`amber-100`)
  - Border: `#FDE68A` (`amber-200`)
  - Foreground: `#D97706` (`amber-600`)
  - Text Dark: `#92400E` (`amber-800`)
- **Danger / Violation (Proctor Breach, Failed Exam, Negative Marking)**:
  - Background: `#FEF2F2` (`red-100`)
  - Border: `#FECACA` (`red-200`)
  - Foreground: `#DC2626` (`red-600`)
  - Text Dark: `#991B1B` (`red-800`)

### Code Editor Theme
- Canvas Background: `#0F172A` (`slate-900`)
- Active Line / Container: `#1E293B` (`slate-800`)
- Gutter / Line Numbers: `#64748B` (`slate-500`)
- Accent Syntax Keywords: `#60A5FA` (`blue-400`)
- Accent Strings: `#4ADE80` (`green-400`)
- Accent Comments: `#94A3B8` (`slate-400`)

---

## 🔤 2. Typography

- **Primary UI Sans**: `Inter`, system-ui, -apple-system, Roboto, sans-serif
  - `font-normal`: Weight 400
  - `font-medium`: Weight 500
  - `font-semibold`: Weight 600
  - `font-bold`: Weight 700
  - `font-extrabold`: Weight 800
- **Monospace (Code & Numbers)**: `FiraCode`, `Courier New`, monospace

### Type Scale
- `text-xs`: 12px (line-height: 16px) — Badges, metadata tags, line counters
- `text-sm`: 14px (line-height: 20px) — Body secondary, helper hints, labels
- `text-base`: 16px (line-height: 24px) — Body text, question prompts, inputs
- `text-lg`: 18px (line-height: 28px) — Card titles, question headers
- `text-xl`: 20px (line-height: 28px) — Modal headers, section titles
- `text-2xl`: 24px (line-height: 32px) — Screen titles, dashboard headers
- `text-4xl`: 36px / 48px — Big exam timers, score displays

---

## 📐 3. Spacing & Elevation Scale

### Radii
- `rounded-md`: 6px (Badges, tags, code chips)
- `rounded-lg`: 8px (Buttons, text inputs)
- `rounded-xl`: 12px (Cards, alerts, modals)
- `rounded-2xl`: 16px (Hero containers, large cards)
- `rounded-full`: 9999px (Pills, user avatars, radio buttons)

### Elevation & Shadows
- `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)`

---

## 🧩 4. Core Component Specifications

### Cards
- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Border Radius: 12px (`rounded-xl`)
- Padding: 16px or 20px
- Shadow: `shadow-sm`

### Primary Buttons
- Background: `#2563EB` (`bg-primary-600`)
- Active/Hover: `#1D4ED8` (`bg-primary-700`)
- Text Color: `#FFFFFF`
- Font: Semibold (600), 15px
- Padding: 12px vertical, 20px horizontal
- Border Radius: 8px (`rounded-lg`)

### Loading Skeletons
- Surface: `#F1F5F9` (`slate-100`) pulsing to `#E2E8F0` (`slate-200`)
- Radius matching the component being loaded (e.g. 12px for card skeleton, 6px for text line skeleton).
