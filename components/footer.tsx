/**
 * @fileoverview Footer component with Product, Legal, and Community links.
 * 
 * Reasoning:
 * - Static footer with three-column layout for navigation
 * - Follows marketing site pattern with glassmorphism styling
 * - Links to pricing pages and legal documentation
 * 
 * Dependencies:
 * - next/link for client-side navigation
 */

import Link from "next/link"

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Column 1: Product */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-sm font-semibold text-white">Product</h3>
                        <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            Pricing
                        </Link>
                        <Link href="/pricing#discount" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            Special Discount
                        </Link>
                        <Link href="/pricing#enterprise" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            Custom Need
                        </Link>
                    </div>

                    {/* Column 2: Legal */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-sm font-semibold text-white">Legal</h3>
                        <Link href="/legal" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/legal" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            Cookie Settings
                        </Link>
                        <Link href="/legal" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/legal" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            Platform Rules
                        </Link>
                        <Link href="/legal" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            Report Abuse
                        </Link>
                    </div>

                    {/* Column 3: Community */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-sm font-semibold text-white">Community</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            Hire an expert
                        </Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            Affiliates
                        </Link>
                        <Link href="https://twitter.com" target="_blank" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            X / Twitter
                        </Link>
                        <Link href="https://linkedin.com" target="_blank" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            LinkedIn
                        </Link>
                    </div>
                </div>

                <div className="mt-12 border-t border-white/5 pt-8 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} VibeCRM. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
