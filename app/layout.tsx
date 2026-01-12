import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
    title: "VibeCRM - AI-Native CRM Platform",
    description: "Generate custom CRM systems from natural language with AI",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
                <Toaster position="top-right" richColors />
            </body>
        </html>
    );
}
