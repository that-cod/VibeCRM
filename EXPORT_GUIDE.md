# VibeCRM Code Export Guide

## Overview

VibeCRM now supports **complete code export** functionality, allowing you to download your AI-generated CRM as a production-ready Next.js application or push it directly to GitHub.

---

## 🎯 What You Get

When you export your CRM, you receive a **complete, standalone Next.js 14 application** with:

### ✅ Full Application Structure
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** client pre-configured
- **shadcn/ui** components

### ✅ Generated Code
- **CRUD Pages** for all your tables (List, Create, Edit, Show)
- **TypeScript Types** for all your data models
- **Form Components** with validation
- **Table Components** with pagination and search
- **Responsive UI** that works on mobile and desktop

### ✅ Configuration Files
- `package.json` with all dependencies
- `tsconfig.json` for TypeScript
- `tailwind.config.ts` for styling
- `.env.example` for environment variables
- `README.md` with setup instructions

### ✅ Production Ready
- No framework dependencies (no Refine.dev)
- Clean, maintainable code
- Follows Next.js best practices
- Ready to deploy to Vercel/Netlify

---

## 📦 Export Options

### 1. **Download as ZIP**
Download your complete project as a ZIP file.

**Use Case:** 
- You want to develop locally
- You need full control over the code
- You want to customize extensively

**Steps:**
1. Go to your dashboard
2. Click "Export Code" button
3. Select "Download ZIP"
4. Click "Download ZIP"
5. Extract and run `npm install`

### 2. **Push to GitHub**
Push your code directly to a GitHub repository.

**Use Case:**
- You want version control
- You want to deploy via GitHub
- You want to collaborate with a team

**Steps:**
1. Create a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select `repo` scope
   - Copy the token
2. Go to your dashboard
3. Click "Export Code" button
4. Select "Push to GitHub"
5. Enter your GitHub token
6. Enter repository name (format: `username/repo-name`)
7. Click "Push to GitHub"

---

## 🚀 Using Your Exported Code

### Step 1: Setup

```bash
# If you downloaded ZIP, extract it first
unzip your-crm.zip
cd your-crm

# Install dependencies
npm install
```

### Step 2: Configure Environment

Create `.env.local` file (already included with your Supabase credentials):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Step 4: Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
your-crm/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   └── [resource]/              # Resource pages
│       ├── page.tsx             # List view
│       ├── create/
│       │   └── page.tsx         # Create form
│       └── [id]/
│           ├── page.tsx         # Detail view
│           └── edit/
│               └── page.tsx     # Edit form
├── components/
│   └── ui/                      # UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── ...
├── lib/
│   ├── supabase/
│   │   └── client.ts            # Supabase client
│   ├── types/                   # TypeScript types
│   │   └── [resource].ts
│   └── utils.ts                 # Utility functions
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── tailwind.config.ts           # Tailwind config
├── next.config.js               # Next.js config
└── README.md                    # Setup guide
```

---

## 🔧 Customization Guide

### Adding New Fields

1. Add column to Supabase table
2. Update type in `lib/types/[resource].ts`
3. Add field to form in `app/[resource]/create/page.tsx`
4. Add field to edit form in `app/[resource]/[id]/edit/page.tsx`
5. Add column to table in `app/[resource]/page.tsx`

### Styling Changes

All components use Tailwind CSS. Modify classes directly in components or update `tailwind.config.ts` for theme changes.

### Adding Authentication

The exported code uses Supabase client. To add auth:

```typescript
// In any component
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Adding New Pages

Create new files in `app/` directory following Next.js App Router conventions.

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub (if not already)
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

### Deploy to Netlify

1. Push code to GitHub
2. Go to https://netlify.com
3. Click "Add new site"
4. Select your repository
5. Build command: `npm run build`
6. Publish directory: `.next`
7. Add environment variables
8. Click "Deploy"

---

## 🔐 Security Considerations

### Row Level Security (RLS)

All your tables have RLS enabled. The exported code respects these policies:

```sql
-- Example RLS policy (already applied)
CREATE POLICY "Users can only see their own data"
ON your_table
FOR ALL
USING (user_id = auth.uid());
```

### Environment Variables

**Never commit `.env.local` to Git!** It's already in `.gitignore`.

### API Keys

The exported code uses the **anon key** (public key). This is safe because RLS protects your data.

---

## 📊 Database Schema

Your exported application connects to the **same Supabase database** you provisioned in VibeCRM. All tables, RLS policies, and relationships are already set up.

### Tables Included

Your export includes CRUD interfaces for all tables in your schema:

- Full CRUD operations (Create, Read, Update, Delete)
- Pagination and search
- Form validation
- Relationship handling

---

## 🐛 Troubleshooting

### "Cannot find module" errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment variables not working

Make sure your `.env.local` file is in the **root directory** and contains valid Supabase credentials.

### Build errors

```bash
# Check TypeScript errors
npm run lint

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Supabase connection issues

Verify your Supabase URL and anon key in `.env.local`. Test connection:

```typescript
const { data, error } = await supabase.from('your_table').select('*').limit(1);
console.log(data, error);
```

---

## 🔄 Re-exporting After Changes

If you modify your schema in VibeCRM:

1. Provision the new schema
2. Export code again
3. Compare with your customized code
4. Merge changes manually

**Tip:** Use Git to track your customizations so you can easily merge new exports.

---

## 💡 Best Practices

### 1. Version Control
Always use Git to track changes to your exported code.

### 2. Environment Management
Use different `.env` files for development, staging, and production.

### 3. Testing
Add tests for critical business logic:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### 4. Code Quality
Run linting before committing:

```bash
npm run lint
```

### 5. Performance
- Use Next.js Image component for images
- Implement proper caching strategies
- Monitor bundle size

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

## 🆘 Support

If you encounter issues with the exported code:

1. Check this guide first
2. Review the generated README.md in your project
3. Check Supabase logs for database errors
4. Verify environment variables are correct

---

## 🎉 What's Next?

Your exported CRM is a **starting point**. You can:

- ✅ Add custom business logic
- ✅ Integrate third-party services
- ✅ Add advanced features (charts, reports, etc.)
- ✅ Customize the UI/UX
- ✅ Add authentication flows
- ✅ Implement webhooks and automations
- ✅ Scale to production

**You own the code completely!** No vendor lock-in, no limitations.

---

## 📝 Example: Customizing a Form

```typescript
// app/contacts/create/page.tsx

// Add a custom validation
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Add custom submit logic
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  
  // Custom validation
  if (!validateEmail(formData.email)) {
    alert("Invalid email");
    return;
  }
  
  // Custom pre-processing
  const processedData = {
    ...formData,
    email: formData.email.toLowerCase(),
    created_by: "system",
  };
  
  // Submit
  const { error } = await supabase
    .from("contacts")
    .insert(processedData);
  
  if (error) {
    alert("Error: " + error.message);
  } else {
    router.push("/contacts");
  }
}
```

---

**Happy coding! 🚀**
