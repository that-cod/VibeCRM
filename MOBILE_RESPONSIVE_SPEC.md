# Mobile-Responsive Specification
**Version:** 1.0.0  
**Mobile-First Philosophy**

---

## Overview

VibeCRM follows a **mobile-first** design approach, ensuring optimal UX across all device sizes. This document defines breakpoints, responsive patterns, and mobile-specific UI considerations.

---

## Breakpoints

### Standard Tailwind Breakpoints (Used)

```css
/* Mobile (default) */
@media (min-width: 0px) {
  /* Base styles - mobile first */
}

/* Tablet */
@media (min-width: 640px) { /* sm: */  }

/* Tablet Landscape / Small Desktop */
@media (min-width: 768px) { /* md: */  }

/* Desktop */
@media (min-width: 1024px) { /* lg: */  }

/* Large Desktop */
@media (min-width: 1280px) { /* xl: */  }
```

### VibeCRM Device Categories

| Category | Width Range | Breakpoint | Primary UI Pattern |
|----------|-------------|------------|-------------------|
| **Mobile** | 320px - 639px | `(default)` | Card-based lists, bottom sheet forms |
| **Tablet** | 640px - 1023px | `sm:` | Hybrid (cards + mini-table), side drawer forms |
| **Desktop** | 1024px+ | `lg:` | Full DataTable, side panel forms |

---

## Responsive Patterns

### 1. DataTable Responsive Behavior

**Mobile (< 640px): Card View**

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MobileDealsView({ deals }) {
  return (
    <div className="md:hidden space-y-4">
      {deals.map((deal) => (
        <Card key={deal.id} className="cursor-pointer hover:shadow-md transition">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">{deal.name}</CardTitle>
              <Badge variant={deal.status}>{deal.status}</Badge>
            </div>
            <CardDescription className="text-sm">
              {deal.company_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Value</span>
              <span className="font-semibold">${deal.value.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-muted-foreground">Close Date</span>
              <span>{formatDate(deal.close_date)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Tablet (640px - 1023px): Horizontal Scroll with Sticky First Column**

```tsx
export function TabletDealsView({ deals }) {
  return (
    <div className="hidden md:block lg:hidden overflow-x-auto">
      <Table className="min-w-[768px]">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10">Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Close Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell className="sticky left-0 bg-background z-10 font-medium">
                {deal.name}
              </TableCell>
              <TableCell>{deal.company_name}</TableCell>
              <TableCell>${deal.value.toLocaleString()}</TableCell>
              <TableCell><Badge variant={deal.status}>{deal.status}</Badge></TableCell>
              <TableCell>{formatDate(deal.close_date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Desktop (1024px+): Full Table with All Columns**

```tsx
export function DesktopDealsView({ deals }) {
  return (
    <div className="hidden lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Probability</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Close Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell className="font-medium">{deal.name}</TableCell>
              <TableCell>{deal.company_name}</TableCell>
              <TableCell>{deal.contact_name}</TableCell>
              <TableCell>${deal.value.toLocaleString()}</TableCell>
              <TableCell>{deal.probability}%</TableCell>
              <TableCell><Badge variant={deal.status}>{deal.status}</Badge></TableCell>
              <TableCell>{formatDate(deal.close_date)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  {/* Edit, Delete, etc. */}
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Combined Component:**

```tsx
export function ResponsiveDealsTable({ deals }) {
  return (
    <>
      <MobileDealsView deals={deals} />
      <TabletDealsView deals={deals} />
      <DesktopDealsView deals={deals} />
    </>
  );
}
```

---

### 2. Form Layouts (Create/Edit)

**Mobile: Bottom Sheet**

```tsx
import { Sheet, SheetContent } from "@/components/ui/sheet";

<Sheet open={visible} onOpenChange={onClose}>
  <SheetContent 
    side="bottom" 
    className="h-[90vh] rounded-t-xl" // Bottom sheet with rounded top
  >
    <form className="h-full flex flex-col">
      <SheetHeader className="pb-4">
        <Sheet Title>Create Deal</SheetTitle>
      </SheetHeader>
      
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {/* Form fields - full width on mobile */}
        <Input className="w-full" />
        <Select className="w-full" />
      </div>
      
      <div className="sticky bottom-0 bg-background border-t p-4 flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">Save</Button>
      </div>
    </form>
  </SheetContent>
</Sheet>
```

**Tablet/Desktop: Side Drawer**

```tsx
<Sheet open={visible} onOpenChange={onClose}>
  <SheetContent 
    side="right" 
    className="w-full sm:max-w-lg md:max-w-xl" // Responsive width
  >
    <form className="h-full flex flex-col">
      <SheetHeader>
        <SheetTitle>Create Deal</SheetTitle>
      </SheetHeader>
      
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input placeholder="Deal Name" />
          <Select placeholder="Company" />
        </div>
      </div>
      
      <div className="border-t pt-4 flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  </SheetContent>
</Sheet>
```

---

### 3. Navigation & Header

**Mobile: Bottom Navigation Bar**

```tsx
import { Home, Users, FileText, Settings } from "lucide-react";

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="grid grid-cols-4 h-16">
        <NavButton href="/dashboard" icon={<Home />} label="Home" />
        <NavButton href="/deals" icon={<FileText />} label="Deals" />
        <NavButton href="/contacts" icon={<Users />} label="Contacts" />
        <NavButton href="/settings" icon={<Settings />} label="Settings" />
      </div>
    </nav>
  );
}

function NavButton({ href, icon, label }) {
  return (
    <Link 
      href={href}
      className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
```

**Tablet/Desktop: Sidebar**

```tsx
export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex w-64 border-r bg-background">
      <nav className="flex flex-col gap-2 p-4 w-full">
        <SidebarButton href="/dashboard" icon={<Home />} label="Dashboard" />
        <SidebarButton href="/deals" icon={<FileText />} label="Deals" />
        <SidebarButton href="/contacts" icon={<Users />} label="Contacts" />
        {/* ... more items */}
      </nav>
    </aside>
  );
}
```

---

### 4. Filters & Search

**Mobile: Collapsible Panel**

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Filter } from "lucide-react";

export function MobileFilters() {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="md:hidden mb-4">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </span>
            {open ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2 space-y-3 border rounded-lg p-4">
          <Input placeholder="Search..." />
          <Select placeholder="Status" />
          <Select placeholder="Company" />
          <Button variant="outline" size="sm" className="w-full">Clear Filters</Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
```

**Desktop: Inline Filters**

```tsx
export function DesktopFilters() {
  return (
    <div className="hidden md:flex gap-4 mb-6">
      <Input placeholder="Search deals..." className="max-w-sm" />
      <Select placeholder="Status" className="w-[180px]" />
      <Select placeholder="Company" className="w-[200px]" />
      <Button variant="outline">Clear</Button>
    </div>
  );
}
```

---

## Touch Gestures (Mobile Only)

### Swipe to Delete

```tsx
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

export function SwipeableCard({ item, onDelete }) {
  const x = useMotionValue(0);
  const backgroundColor = useTransform(
    x,
    [-200, 0],
    ["hsl(var(--destructive))", "hsl(var(--background))"]
  );
  
  function handleDragEnd(event: any, info: PanInfo) {
    if (info.offset.x < -150) {
      // Swiped left beyond threshold
      onDelete(item.id);
    }
  }
  
  return (
    <motion.div
      className="relative"
      drag="x"
      dragConstraints={{ left: -200, right: 0 }}
      style={{ x, backgroundColor }}
      onDragEnd={handleDragEnd}
    >
      <Card>{/* Card content */}</Card>
      
      {/* Delete indicator (visible when swiping) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-destructive-foreground">
        <Trash2 className="h-6 w-6" />
      </div>
    </motion.div>
  );
}
```

### Pull to Refresh

```tsx
import { useState } from "react";

export function PullToRefreshList({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  
  function handleTouchStart(e: React.TouchEvent) {
    setStartY(e.touches[0].clientY);
  }
  
  function handleTouchMove(e: React.TouchEvent) {
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    if (diff > 80 && window.scrollY === 0) {
      setPulling(true);
    }
  }
  
  async function handleTouchEnd() {
    if (pulling) {
      await onRefresh();
     setPulling(false);
    }
  }
  
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {pulling && (
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {children}
    </div>
  );
}
```

---

## Typography Scaling

### Responsive Font Sizes

```css
/* Mobile-optimized font sizes */
.heading-1 {
  @apply text-2xl md:text-3xl lg:text-4xl font-bold;
}

.heading-2 {
  @apply text-xl md:text-2xl lg:text-3xl font-semibold;
}

.body {
  @apply text-sm md:text-base;
}

.caption {
  @apply text-xs md:text-sm text-muted-foreground;
}
```

---

## Performance Optimizations for Mobile

### 1. Lazy Load Images

```tsx
import Image from "next/image";

<Image
  src={avatarUrl}
  alt={name}
  width={40}
  height={40}
  loading="lazy"
  className="rounded-full"
/>
```

### 2. Virtualized Lists (For Long Lists)

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

export function VirtualizedDealsList({ deals }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: deals.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated card height
  });
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <DealCard deal={deals[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Reduce Bundle Size (Code Splitting)

```tsx
// Dynamic import for mobile-only components
const MobileFilters = dynamic(() => import("@/components/MobileFilters"), {
  ssr: false,
  loading: () => <Skeleton className="h-10 w-full" />,
});
```

---

## Accessibility on Mobile

- ✅ **Touch Target Size:** Minimum 44x44px (Apple HIG)
- ✅ **Tap Highlights:** Disable default (use custom feedback)
  ```css
  * {
    -webkit-tap-highlight-color: transparent;
  }
  ```
- ✅ **Readable Font Size:** Minimum 16px to prevent zoom on iOS
- ✅ **Landscape Support:** Test all views in both orientations

---

## Testing Checklist

- [ ] Test on real iOS device (Safari)
- [ ] Test on real Android device (Chrome)
- [ ] Test swipe gestures (left/right)
- [ ] Test pull-to-refresh
- [ ] Test keyboard appearance (input focus)
- [ ] Test landscape orientation
- [ ] Test with slow 3G throttling
- [ ] Verify touch targets are ≥44px
- [ ] Check font sizes without zoom

---

## Device-Specific Quirks

### iOS Safari
- **Issue:** `100vh` includes address bar
- **Fix:** Use `100dvh` (dynamic viewport height) or JavaScript calculation

```css
.full-height-mobile {
  height: 100dvh; /* Dynamic viewport height */
  height: calc(var(--vh, 1vh) * 100); /* Fallback */
}
```

```tsx
// Set CSS variable for actual viewport height
useEffect(() => {
  const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };
  
  setVh();
  window.addEventListener("resize", setVh);
  return () => window.removeEventListener("resize", setVh);
}, []);
```

### Android Chrome
- **Issue:** Address bar autohide causes layout shifts
- **Fix:** Use `position: sticky` instead of `fixed` for bottom nav

---

## Summary

**Mobile-First Benefits:**
- ✅ Forces prioritization of essential features
- ✅ Better performance (less code for mobile)
- ✅ Easier progressive enhancement

**Key Principle:** Design for mobile, enhance for desktop (not the reverse).
