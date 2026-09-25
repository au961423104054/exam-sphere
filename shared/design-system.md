# ExamSphere Design System & Visual Specification

This document defines the single source of truth for the **ExamSphere** visual identity across the **Web Frontend** (`React + Tailwind CSS`) and the **Mobile Application** (`React Native + NativeWind / StyleSheet`). All platforms and UI components must strictly adhere to these tokens to ensure visual parity.

---

## 1. Color Palette

### 1.1 Primary & Accent Palette

| Token Name | Hex Code | Tailwind / Style Token | Usage / Semantics |
| :--- | :--- | :--- | :--- |
| **Primary 900** | `#312E81` | `brand-primary-900` | Deepest brand backdrop, high-contrast borders |
| **Primary 700** | `#4338CA` | `brand-primary-700` | Hover state for primary buttons & active tab links |
| **Primary 600** | `#4F46E5` | `brand-primary-600` | **Primary Brand Color**: Primary CTAs, active highlights, key accents |
| **Primary 500** | `#6366F1` | `brand-primary-500` | Focus rings, interactive icon accents |
| **Primary 100** | `#E0E7FF` | `brand-primary-100` | Light button surfaces, active card backgrounds |
| **Primary 50**  | `#EEF2FF` | `brand-primary-50`  | Subtle tint highlights, active navigation pill background |
| **Accent 700**  | `#0F766E` | `brand-accent-700`  | Dark teal highlight, secondary actions hover |
| **Accent 600**  | `#0D9488` | `brand-accent-600`  | **Secondary Accent**: Proctoring badges, timer counters, run code buttons |
| **Accent 500**  | `#14B8A6` | `brand-accent-500`  | Focus indicators, teal gradients |
| **Accent 50**   | `#F0FDFA` | `brand-accent-50`   | Light teal container backgrounds |

---

### 1.2 Neutral Slate Scale

| Token Name | Hex Code | Tailwind Token | Usage |
| :--- | :--- | :--- | :--- |
| **Slate 900** | `#0F172A` | `slate-900` | Primary headings, darkest card text, code editor background (dark) |
| **Slate 800** | `#1E293B` | `slate-800` | Sidebar background, secondary dark surfaces |
| **Slate 700** | `#334155` | `slate-700` | Body text (high contrast), subheadings |
| **Slate 500** | `#64748B` | `slate-500` | Muted descriptions, secondary labels, disabled text |
| **Slate 400** | `#94A3B8` | `slate-400` | Placeholder text, inactive tab borders |
| **Slate 200** | `#E2E8F0` | `slate-200` | Card borders, table dividers, input borders |
| **Slate 100** | `#F1F5F9` | `slate-100` | Subdued background containers, skeleton loader base |
| **Slate 50**  | `#F8FAFC` | `slate-50`  | Main application canvas background |
| **White**     | `#FFFFFF` | `white`     | Card surface, modal surface, elevated layers |

---

### 1.3 Semantic & Integrity Status Colors

| Semantic State | Hex Code | Light Tint | Token | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Passed** | `#10B981` | `#ECFDF5` | `emerald-500` / `emerald-50` | Passed test cases, submitted exams, nominal security |
| **Warning / Caution** | `#F59E0B` | `#FFFBEB` | `amber-500` / `amber-50` | Minor proctoring warning, expiring exam timer (<5 min) |
| **Danger / Violation** | `#EF4444` | `#FEF2F2` | `rose-500` / `rose-50` | Integrity violation, failed tests, exam auto-submitted |
| **Information** | `#3B82F6` | `#EFF6FF` | `blue-500` / `blue-50` | Question instructions, system notices, tips |

---

## 2. Typography

### 2.1 Font Pairings (Google Fonts)

- **Headings & Display**: `Plus Jakarta Sans`, sans-serif
  - Weights: `600` (SemiBold), `700` (Bold), `800` (ExtraBold)
  - Letter-spacing: `-0.02em` (tight tracking for modern look)
- **Body & UI**: `Inter`, -apple-system, sans-serif
  - Weights: `400` (Regular), `500` (Medium), `600` (SemiBold)
  - Letter-spacing: `normal`
- **Code & Syntax**: `JetBrains Mono`, `Fira Code`, monospace
  - Weights: `400` (Regular), `500` (Medium)
  - Usage: Monaco Editor, question code snippets, test case inputs/outputs, route tokens.

### 2.2 Type Scale

| Level | Size (Web) | Line Height | Weight | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **Display 1** | `2.25rem` (36px) | `2.5rem` (40px) | Bold (`700`) | `-0.025em` |
| **Display 2** | `1.875rem` (30px)| `2.25rem` (36px) | Bold (`700`) | `-0.02em` |
| **Heading 1** | `1.5rem` (24px)  | `2rem` (32px)    | SemiBold (`600`) | `-0.015em` |
| **Heading 2** | `1.25rem` (20px) | `1.75rem` (28px) | SemiBold (`600`) | `-0.01em` |
| **Subheading**| `1.125rem` (18px)| `1.5rem` (24px)  | Medium (`500`) | `normal` |
| **Body Large**| `1rem` (16px)    | `1.5rem` (24px)  | Regular (`400`) | `normal` |
| **Body Base** | `0.875rem` (14px)| `1.25rem` (20px) | Regular (`400`) | `normal` |
| **Caption**   | `0.75rem` (12px) | `1rem` (16px)    | Medium (`500`) | `0.02em` |

---

## 3. Spacing & Layout Scale

Adheres to a strict 4px grid system:

- **2xs**: `4px` (`0.25rem`) — micro padding, badge internal gaps
- **xs**: `8px` (`0.5rem`) — compact element spacing, button icon gaps
- **sm**: `12px` (`0.75rem`) — form control internal padding, list item gaps
- **md**: `16px` (`1rem`) — card padding (compact), standard gutter
- **lg**: `24px` (`1.5rem`) — standard card padding, section gap
- **xl**: `32px` (`2rem`) — dashboard widget margins, header clearance
- **2xl**: `48px` (`3rem`) — page canvas padding

---

## 4. Component Tokens & Elevation

### 4.1 Border Radius
- **Small (`rounded-md`)**: `6px` — inline tags, micro-badges, code snippets
- **Medium (`rounded-lg`)**: `8px` — inputs, standard buttons, dropdown menus
- **Large (`rounded-xl`)**: `12px` — cards, modal dialogs, dashboard stat widgets
- **Pill (`rounded-full`)**: `9999px` — status indicators, user avatars, pill badges

### 4.2 Elevation / Shadows
- **Flat**: `none`
- **Subtle (`shadow-sm`)**: `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Standard card rest state)
- **Medium (`shadow-md`)**: `0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)` (Card hover, dropdowns)
- **Elevated (`shadow-xl`)**: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.08)` (Modals, security violation alerts)

### 4.3 Borders
- Standard border color: `border-slate-200` (`#E2E8F0`)
- Subtle border: `border-slate-100` (`#F1F5F9`)
- Interactive hover border: `border-indigo-300` (`#A5B4FC`)
- Focused input ring: `ring-2 ring-indigo-500/20 border-indigo-500`

---

## 5. Mobile App Parity Guide (React Native)

When styling React Native components in `mobile-app/src/`:
1. Use the exact hex color codes from Section 1 above in your `StyleSheet` or Tailwind / NativeWind config.
2. Load the equivalent font family using Expo Font (`expo-google-fonts/plus-jakarta-sans` and `expo-google-fonts/inter`).
3. Maintain the 8px / 12px border radius standards for buttons and assessment cards.
4. Use identical semantic colors for violation banners and test case results.
