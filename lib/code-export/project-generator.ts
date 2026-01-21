/**
 * @fileoverview Generate complete Next.js project structure from CRM schema
 * 
 * Reasoning:
 * - Creates full project with all necessary files
 * - Includes configuration, dependencies, and documentation
 * - Production-ready, standalone Next.js application
 */

import type { CRMSchema } from "@/types/schema";
import type { Resource } from "@/lib/code-generator/schemas";
import { convertSchemaToResources } from "@/lib/integration/schema-to-resource";
import {
  generateTypeDefinitions,
  generateListPage,
  generateCreatePage,
  generateEditPage,
  generateShowPage,
} from "./component-generator";

export interface CodeFile {
  path: string;
  content: string;
}

/**
 * Generate complete project from CRM schema
 */
export function generateProjectFiles(
  schema: CRMSchema,
  projectName: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): CodeFile[] {
  const resources = convertSchemaToResources(schema);
  const files: CodeFile[] = [];

  // 1. Package.json
  files.push({
    path: "package.json",
    content: generatePackageJson(projectName),
  });

  // 2. Environment variables
  files.push({
    path: ".env.local",
    content: generateEnvFile(supabaseUrl, supabaseAnonKey),
  });

  files.push({
    path: ".env.example",
    content: generateEnvExample(),
  });

  // 3. Next.js config
  files.push({
    path: "next.config.js",
    content: generateNextConfig(),
  });

  // 4. TypeScript config
  files.push({
    path: "tsconfig.json",
    content: generateTsConfig(),
  });

  // 5. Tailwind config
  files.push({
    path: "tailwind.config.ts",
    content: generateTailwindConfig(),
  });

  files.push({
    path: "postcss.config.js",
    content: generatePostCssConfig(),
  });

  // 6. Global styles
  files.push({
    path: "app/globals.css",
    content: generateGlobalStyles(),
  });

  // 7. Root layout
  files.push({
    path: "app/layout.tsx",
    content: generateRootLayout(projectName),
  });

  // 8. Home page
  files.push({
    path: "app/page.tsx",
    content: generateHomePage(resources),
  });

  // 9. Supabase client
  files.push({
    path: "lib/supabase/client.ts",
    content: generateSupabaseClient(),
  });

  // 10. UI components (shadcn/ui)
  files.push(...generateUIComponents());

  // 11. For each resource, generate CRUD pages and types
  resources.forEach(resource => {
    // Types
    files.push({
      path: `lib/types/${resource.name}.ts`,
      content: generateTypeDefinitions(resource),
    });

    // List page
    files.push({
      path: `app/${resource.plural_name}/page.tsx`,
      content: generateListPage(resource),
    });

    // Create page
    files.push({
      path: `app/${resource.plural_name}/create/page.tsx`,
      content: generateCreatePage(resource),
    });

    // Show page
    files.push({
      path: `app/${resource.plural_name}/[id]/page.tsx`,
      content: generateShowPage(resource),
    });

    // Edit page
    files.push({
      path: `app/${resource.plural_name}/[id]/edit/page.tsx`,
      content: generateEditPage(resource),
    });
  });

  // 12. README
  files.push({
    path: "README.md",
    content: generateReadme(projectName, resources),
  });

  // 13. .gitignore
  files.push({
    path: ".gitignore",
    content: generateGitignore(),
  });

  return files;
}

function generatePackageJson(projectName: string): string {
  return JSON.stringify({
    name: projectName.toLowerCase().replace(/\s+/g, "-"),
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
    },
    dependencies: {
      "@supabase/supabase-js": "^2.39.0",
      "next": "^14.1.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "lucide-react": "^0.309.0",
      "clsx": "^2.1.0",
      "tailwind-merge": "^2.2.0",
    },
    devDependencies: {
      "@types/node": "^20.11.0",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "autoprefixer": "^10.4.17",
      "postcss": "^8.4.33",
      "tailwindcss": "^3.4.1",
      "typescript": "^5.3.3",
      "eslint": "^8.56.0",
      "eslint-config-next": "^14.1.0",
    },
  }, null, 2);
}

function generateEnvFile(supabaseUrl: string, supabaseAnonKey: string): string {
  return `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
`;
}

function generateEnvExample(): string {
  return `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
`;
}

function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
`;
}

function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: {
        "@/*": ["./*"],
      },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  }, null, 2);
}

function generateTailwindConfig(): string {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
`;
}

function generatePostCssConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

function generateGlobalStyles(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
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
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;
}

function generateRootLayout(projectName: string): string {
  return `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "${projectName}",
  description: "AI-generated CRM application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
`;
}

function generateHomePage(resources: Resource[]): string {
  return `import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  const resources = ${JSON.stringify(resources.map(r => ({
    name: r.plural_name,
    label: r.plural_label,
    description: r.description,
  })), null, 4)};

  return (
    <div className="container mx-auto py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your CRM</h1>
        <p className="text-xl text-muted-foreground">
          Manage your business data efficiently
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <Link key={resource.name} href={\`/\${resource.name}\`}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle>{resource.label}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
`;
}

function generateSupabaseClient(): string {
  return `import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`;
}

function generateUIComponents(): CodeFile[] {
  return [
    {
      path: "lib/utils.ts",
      content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
    },
    {
      path: "components/ui/button.tsx",
      content: `import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "h-10 px-4 py-2": size === "default",
            "h-9 px-3": size === "sm",
            "h-11 px-8": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
`,
    },
    {
      path: "components/ui/input.tsx",
      content: `import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
`,
    },
    {
      path: "components/ui/label.tsx",
      content: `import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
`,
    },
    {
      path: "components/ui/textarea.tsx",
      content: `import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
`,
    },
    {
      path: "components/ui/card.tsx",
      content: `import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
`,
    },
    {
      path: "components/ui/table.tsx",
      content: `import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  )
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
`,
    },
  ];
}

function generateReadme(projectName: string, resources: Resource[]): string {
  return `# ${projectName}

AI-generated CRM application built with Next.js and Supabase.

## Features

${resources.map(r => `- **${r.plural_label}**: ${r.description}`).join("\n")}

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\` and add your Supabase credentials.

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
${resources.map(r => `│   └── ${r.plural_name}/        # ${r.plural_label} CRUD pages`).join("\n")}
├── components/            # Reusable UI components
├── lib/                   # Utilities and types
│   ├── supabase/         # Supabase client
│   └── types/            # TypeScript types
└── public/               # Static assets
\`\`\`

## Database Schema

This application uses the following tables:

${resources.map(r => `- \`${r.name}\`: ${r.description}`).join("\n")}

All tables include:
- \`id\`: UUID primary key
- \`user_id\`: Foreign key to auth.users
- \`created_at\`: Timestamp
- \`updated_at\`: Timestamp

Row Level Security (RLS) is enabled on all tables.

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy

## Tech Stack

- **Framework**: Next.js 14
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **UI Components**: shadcn/ui

## License

MIT
`;
}

function generateGitignore(): string {
  return `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;
}
