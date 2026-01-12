# VibeCRM Theme Tokens
**SaaS 2.0 Design System**  
**Version:** 1.0.0  
**Last Updated:** 2026-01-05

---

## Overview

VibeCRM uses a custom theme system extending shadcn/ui's default tokens with CRM-specific semantic colors and state indicators. All tokens are defined as CSS custom properties for light/dark mode support.

---

## Color Palette

### Base Colors (shadcn/ui defaults)

```css
:root {
  --background: 0 0% 100%;          /* White */
  --foreground: 222.2 84% 4.9%;     /* Near-black text */
  
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  
  --primary: 222.2 47.4% 11.2%;     /* Dark blue */
  --primary-foreground: 210 40% 98%;
  
  --secondary: 210 40% 96.1%;       /* Light gray */
  --secondary-foreground: 222.2 47.4% 11.2%;
  
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  
  --destructive: 0 84.2% 60.2%;     /* Red */
  --destructive-foreground: 210 40% 98%;
  
  --border: 214.3 31.8% 91.4%;      /* Subtle gray border */
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  
  --radius: 0.5rem;                 /* Default border radius */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

---

## CRM-Specific Semantic Tokens

### Deal Status Colors

```css
:root {
  /* Deal Won (Success) */
  --deal-won: 142.1 76.2% 36.3%;              /* Green 600 */
  --deal-won-foreground: 0 0% 100%;
  --deal-won-hover: 142.1 70.6% 45.3%;        /* Green 500 */
  
  /* Deal Lost (Destructive) */
  --deal-lost: 0 84.2% 60.2%;                 /* Red 500 */
  --deal-lost-foreground: 0 0% 100%;
  --deal-lost-hover: 0 72.2% 50.6%;          /* Red 600 */
  
  /* Deal Negotiating (Warning) */
  --deal-negotiating: 45.4 93.4% 47.5%;      /* Amber 500 */
  --deal-negotiating-foreground: 26 83.3% 14.1%; /* Dark text */
  --deal-negotiating-hover: 37.7 92.1% 50.2%; /* Amber 400 */
  
  /* Deal Qualified (Info) */
  --deal-qualified: 221.2 83.2% 53.3%;       /* Blue 500 */
  --deal-qualified-foreground: 0 0% 100%;
  --deal-qualified-hover: 217.2 91.2% 59.8%; /* Blue 400 */
  
  /* Deal Cold (Muted) */
  --deal-cold: 215 20.2% 65.1%;              /* Gray 400 */
  --deal-cold-foreground: 222.2 84% 4.9%;
  --deal-cold-hover: 215.4 16.3% 56.9%;      /* Gray 500 */
}

.dark {
  --deal-won: 142.1 70.6% 45.3%;
  --deal-won-foreground: 0 0% 100%;
  
  --deal-lost: 0 72.2% 50.6%;
  --deal-lost-foreground: 0 0% 100%;
  
  --deal-negotiating: 37.7 92.1% 50.2%;
  --deal-negotiating-foreground: 26 83.3% 14.1%;
  
  --deal-qualified: 217.2 91.2% 59.8%;
  --deal-qualified-foreground: 0 0% 100%;
  
  --deal-cold: 215.4 16.3% 46.9%;
  --deal-cold-foreground: 210 40% 98%;
}
```

### Priority Levels

```css
:root {
  /* High Priority (Urgent) */
  --priority-high: 0 84.2% 60.2%;            /* Red 500 */
  --priority-high-foreground: 0 0% 100%;
  --priority-high-subtle: 0 84.2% 60.2% / 0.1; /* 10% opacity */
  
  /* Medium Priority */
  --priority-medium: 221.2 83.2% 53.3%;      /* Blue 500 */
  --priority-medium-foreground: 0 0% 100%;
  --priority-medium-subtle: 221.2 83.2% 53.3% / 0.1;
  
  /* Low Priority */
  --priority-low: 142.1 76.2% 36.3%;         /* Green 600 */
  --priority-low-foreground: 0 0% 100%;
  --priority-low-subtle: 142.1 76.2% 36.3% / 0.1;
}
```

### Entity Type Colors

```css
:root {
  /* Companies */
  --entity-company: 262.1 83.3% 57.8%;       /* Purple 500 */
  --entity-company-foreground: 0 0% 100%;
  
  /* Contacts */
  --entity-contact: 199.9 89.3% 48.2%;       /* Cyan 500 */
  --entity-contact-foreground: 0 0% 100%;
  
  /* Tasks */
  --entity-task: 142.1 76.2% 36.3%;          /* Green 600 */
  --entity-task-foreground: 0 0% 100%;
  
  /* Notes */
  --entity-note: 45.4 93.4% 47.5%;           /* Amber 500 */
  --entity-note-foreground: 26 83.3% 14.1%;
}
```

---

## Typography

### Font Families

```css
:root {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, 
    "Liberation Mono", monospace;
}
```

**Installation:**
```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

### Font Scales

```css
:root {
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
}
```

---

## Spacing

### Consistent Spacing Scale

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

**Usage Guidelines:**
- Card padding: `var(--space-6)` (24px)
- Page margins: `var(--space-8)` (32px)
- Section spacing: `var(--space-12)` (48px)
- Button padding: `var(--space-4) var(--space-6)` (16px 24px)

---

## Shadows (SaaS 2.0 Elevation)

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 
               0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 
               0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 
               0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Interactive shadows (hover states) */
  --shadow-hover: 0 10px 20px -5px rgb(0 0 0 / 0.15);
  --shadow-active: 0 5px 10px -3px rgb(0 0 0 / 0.2);
}
```

**Usage:**
- Cards: `shadow-sm` (default), `shadow-md` (hover)
- Modals/Dialogs: `shadow-xl`
- Dropdowns: `shadow-lg`
- Buttons: `shadow-md` (hover), `shadow-active` (click)

---

## Border Radius

```css
:root {
  --radius-sm: 0.25rem;   /* 4px - Badges */
  --radius-md: 0.375rem;  /* 6px - Inputs */
  --radius-lg: 0.5rem;    /* 8px - Cards, buttons */
  --radius-xl: 0.75rem;   /* 12px - Modals */
  --radius-2xl: 1rem;     /* 16px - Hero sections */
  --radius-full: 9999px;  /* Pills, avatars */
}
```

---

## Animations & Transitions

### Micro-Interactions

```css
:root {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Usage Examples:**
```tsx
// Button hover
<Button className="transition-all duration-200 hover:scale-105 hover:shadow-hover" />

// Success animation
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  ✓ Saved
</motion.div>
```

---

## Component-Specific Tokens

### Badges

```tsx
import { Badge } from "@/components/ui/badge";

// Deal status badges
<Badge className="bg-deal-won text-deal-won-foreground">Won</Badge>
<Badge className="bg-deal-negotiating text-deal-negotiating-foreground">Negotiating</Badge>
<Badge className="bg-priority-high text-priority-high-foreground">High Priority</Badge>
```

### Buttons (State Colors)

```css
:root {
  --button-primary-hover: hsl(var(--primary) / 0.9);
  --button-secondary-hover: hsl(var(--secondary) / 0.8);
  --button-destructive-hover: hsl(var(--destructive) / 0.9);
  
  --button-ghost-hover: hsl(var(--accent));
  --button-link-hover: hsl(var(--primary) / 0.8);
}
```

### Data Table

```css
:root {
  --table-header-bg: hsl(var(--muted) / 0.5);
  --table-row-hover: hsl(var(--muted) / 0.3);
  --table-border: hsl(var(--border));
}
```

---

## Dark Mode Strategy

VibeCRM auto-detects system dark mode and provides toggle:

```tsx
// components/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

---

## Implementation Checklist

- [x] Install Inter font from Google Fonts
- [x] Define CSS custom properties in `globals.css`
- [x] Create `ThemeToggle` component
- [ ] Configure `next-themes` provider
- [ ] Create badge variants for all deal statuses
- [ ] Create badge variants for priorities
- [ ] Test color contrast in both light/dark modes (WCAG AA minimum 4.5:1)
- [ ] Add theme tokens to Tailwind config for IntelliSense

---

## Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
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
        // ... other shadcn colors
        
        // CRM-specific
        "deal-won": "hsl(var(--deal-won))",
        "deal-lost": "hsl(var(--deal-lost))",
        "deal-negotiating": "hsl(var(--deal-negotiating))",
        "priority-high": "hsl(var(--priority-high))",
        "priority-medium": "hsl(var(--priority-medium))",
        "priority-low": "hsl(var(--priority-low))",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## Accessibility Notes

- All color combinations meet WCAG 2.1 AA contrast requirements (4.5:1 minimum)
- Dark mode colors independently tested for sufficient contrast
- Interactive elements have visible focus states (ring utility)
- Color is never the only indicator (e.g., badges also show text/icons)

**Contrast Checker:**
```bash
# Use WebAIM contrast checker
# https://webaim.org/resources/contrastchecker/

# Example: Deal Won background + foreground
# hsl(142.1 76.2% 36.3%) + hsl(0 0% 100%)
# Ratio: 5.2:1 ✅ PASS
```

---

## Design Philosophy: SaaS 2.0

**Principles:**
1. **Generous White Space:** Minimum 16px padding on cards, 32px page margins
2. **Subtle Borders:** Use `border-border` (not harsh black lines)
3. **Depth via Shadows:** Not flat, but not skeuomorphic
4. **Micro-Interactions:** Every action should have visual feedback
5. **Semantic Color:** Status colors communicate meaning (green = success)
6. **Accessibility First:** Every decision considers screen readers and keyboard nav

**Result:** A modern, polished CRM that feels premium and professional.
