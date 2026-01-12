# shadcn/ui Component Registry

## Currently Installed
- **Layout:** `card`, `separator`, `scroll-area`, `tabs`
- **Form:** `button`, `input`, `select`, `checkbox`, `label`, `form` (react-hook-form), `textarea`, `radio-group`
- **Overlay:** `dialog`, `sheet` (used for side-drawers), `popover`, `alert-dialog`
- **Data Display:** `table`, `badge`, `avatar`, `skeleton`, `progress`
- **Feedback:** `sonner` (toast notifications), `skeleton`, `alert`
- **Navigation:** `dropdown-menu`, `command` (Cmd+K palette)

## Usage Patterns

### Create/Edit Views
Use the **`Sheet`** component for a slide-over experience (better mobile UX than modals):

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useModalForm } from "@refinedev/react-hook-form";

export function DealCreateSheet() {
  const { modal: { visible, close }, saveButtonProps, register } = useModalForm({
    refineCoreProps: { resource: "deals" },
  });
  
  return (
    <Sheet open={visible} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create New Deal</SheetTitle>
        </SheetHeader>
        {/* Form fields using shadcn components */}
      </SheetContent>
    </Sheet>
  );
}
```

### Data Lists
Use the **DataTable** pattern (shadcn table + Refine `useTable`):

```tsx
import { useTable } from "@refinedev/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DealList() {
  const { getRowModel, getHeaderGroups } = useTable({
    columns: dealColumns,
    refineCoreProps: { resource: "deals" },
  });
  
  return (
    <Table>
      <TableHeader>
        {getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>{/* Column header */}</TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {getRowModel().rows.map((row) => (
          <TableRow key={row.id}>{/* Row cells */}</TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Deletion Confirmations
Use **`AlertDialog`** for confirming destructive actions:

```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function DeleteDealDialog({ dealId, onConfirm }) {
  return (
    <AlertDialog>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this deal. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Filters & Search
Use **`Input`** and **`Select`** with Refine's `filters` prop:

```tsx
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DealFilters({ filters, setFilters }) {
  return (
    <div className="flex gap-4">
      <Input
        placeholder="Search deals..."
        onChange={(e) => setFilters([
          { field: "name", operator: "contains", value: e.target.value }
        ])}
      />
      
      <Select onValueChange={(value) => setFilters([
        { field: "status", operator: "eq", value }
      ])}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="negotiating">Negotiating</SelectItem>
          <SelectItem value="won">Won</SelectItem>
          <SelectItem value="lost">Lost</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

### Command Palette (Cmd+K)
Use **`Command`** component for global actions:

```tsx
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => navigate("/deals/create")}>
            Create New Deal
          </CommandItem>
          <CommandItem onSelect={() => navigate("/companies/create")}>
            Create New Company
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

## Responsive Patterns (Mobile-First)

### DataTable Responsive Breakpoints
Based on `MOBILE_RESPONSIVE_SPEC.md`:

**Mobile (< 640px):** Card-based layout
```tsx
<div className="md:hidden space-y-4">
  {deals.map((deal) => (
    <Card key={deal.id}>
      <CardHeader>
        <CardTitle>{deal.name}</CardTitle>
        <CardDescription>{deal.company_name}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant={deal.status}>{deal.status}</Badge>
        <p className="text-sm text-muted-foreground">${deal.value}</p>
      </CardContent>
    </Card>
  ))}
</div>
```

**Tablet/Desktop (≥ 640px):** Full table
```tsx
<div className="hidden md:block">
  <Table>{/* Full DataTable */}</Table>
</div>
```

### Sheet Responsive Sizing
```tsx
<Sheet>
  <SheetContent 
    side="right" 
    className="w-full sm:max-w-lg md:max-w-xl"
  >
    {/* Adapts to screen size */}
  </SheetContent>
</Sheet>
```

## Theme Integration

All components use design tokens from `THEME_TOKENS.md`:

```tsx
// Example: Deal status badge using theme tokens
<Badge 
  variant="default"
  className={cn(
    "font-medium",
    status === "won" && "bg-deal-won text-deal-won-foreground",
    status === "lost" && "bg-deal-lost text-deal-lost-foreground",
    status === "negotiating" && "bg-deal-negotiating text-deal-negotiating-foreground"
  )}
>
  {status}
</Badge>
```

## Loading States

Always use **`Skeleton`** for async operations:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

function DealListLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

// In page.tsx
<Suspense fallback={<DealListLoading />}>
  <DealList />
</Suspense>
```

## Empty States

Use **custom illustrations** with Lucide icons:

```tsx
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

function EmptyDeals() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No deals yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-2">
        Get started by creating your first deal or importing from CSV
      </p>
      <div className="flex gap-2 mt-6">
        <Button onClick={() => navigate("/deals/create")}>
          Create Deal
        </Button>
        <Button variant="outline">
          Import from CSV
        </Button>
      </div>
    </div>
  );
}
```

## Micro-Interactions

### Hover States
```tsx
<Button className="transition-all hover:scale-105 hover:shadow-md">
  Save Changes
</Button>
```

### Success Animations
```tsx
import { CheckCircle } from "lucide-react";

// After successful mutation
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  className="flex items-center gap-2 text-success"
>
  <CheckCircle className="h-5 w-5" />
  <span>Deal created successfully!</span>
</motion.div>
```

### Error Shake
```tsx
<motion.div
  animate={{ x: [0, -10, 10, -10, 10, 0] }}
  transition={{ duration: 0.4 }}
  className="text-destructive"
>
  Invalid email format
</motion.div>
```

## Accessibility Checklist

All shadcn components have built-in a11y (via Radix UI), but ensure:
- ✅ All buttons have `aria-label` or visible text
- ✅ Form inputs have associated `<label>` elements
- ✅ Dialogs trap focus when open
- ✅ Keyboard shortcuts documented in Command palette

## Component Installation

When adding new components:
```bash
npx shadcn-ui@latest add [component-name]
```

**Required Components for VibeCRM:**
- Core: `card`, `button`, `input`, `table`, `sheet`, `dialog`
- Forms: `form`, `select`, `checkbox`, `textarea`, `radio-group`
- Feedback: `sonner`, `skeleton`, `alert`, `badge`
- Navigation: `command`, `dropdown-menu`, `tabs`

## Future Components (Roadmap)

- `calendar` - For date pickers in deal timelines
- `tooltip` - For field help text
- `chart` - For Vibe Replay visualizations
- `data-table` - Enhanced version with built-in sorting/filtering