/**
 * @fileoverview Pricing page with tier comparison and lead capture.
 * 
 * Reasoning:
 * - Three-tier pricing model (Basic/Pro/Enterprise)
 * - "Popular" tier highlighted with visual emphasis
 * - Discount section captures email leads for conversion
 * - Glassmorphism styling maintains brand consistency
 * 
 * Dependencies:
 * - components/fluid-background for brand-consistent background
 * - components/ui for shadcn components
 * - framer-motion for staggered card animations
 */

"use client"

import { FluidBackground } from "@/components/fluid-background"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"

export default function PricingPage() {
    const plans = [
        {
            name: "Basic",
            price: "$29",
            period: "/month",
            description: "Perfect for hobbyists and prototypes.",
            features: ["Single CRM Project", "5 Prompts / Day", "Real-time Preview", "Community Support"],
            buttonText: "Get Started",
            buttonVariant: "outline" as const,
            popular: false
        },
        {
            name: "Pro",
            price: "$49",
            period: "/month",
            description: "For builders who need serious power.",
            features: ["5 CRM Projects", "20 Prompts / Day", "Real-time Preview & Edits", "Schema Export", "Priority Support"],
            buttonText: "Go Pro",
            buttonVariant: "default" as const,
            popular: true
        },
        {
            name: "Enterprise",
            id: "enterprise",
            price: "Custom",
            period: "",
            description: "Unlimited scale for tailored business needs.",
            features: ["Unlimited CRM Projects", "Unlimited Prompts", "Custom Integrations", "SLA Support", "Dedicated Success Manager"],
            buttonText: "Book a Demo",
            buttonVariant: "outline" as const,
            action: () => window.open("https://calendly.com/placeholder-demo", "_blank"),
            popular: false,
            highlight: true
        }
    ]

    return (
        <main className="min-h-screen relative font-sans text-white">
            <FluidBackground />

            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple pricing for complex vibes.</h1>
                        <p className="text-xl text-muted-foreground">Start building your dream tools today.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={index}
                                id={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative flex flex-col p-8 rounded-2xl border ${plan.popular
                                    ? "border-purple-500 bg-purple-500/5 shadow-2xl shadow-purple-900/20"
                                    : "border-white/10 bg-black/40 backdrop-blur-md"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        MOST POPULAR
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        <span className="text-muted-foreground">{plan.period}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">{plan.description}</p>
                                </div>

                                <div className="flex-1 space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                                                <Check className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-sm text-gray-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    className={plan.popular ? "bg-white text-black hover:bg-gray-200" : ""}
                                    variant={plan.buttonVariant}
                                    onClick={plan.action}
                                >
                                    {plan.buttonText}
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Special Discount Section */}
            <section id="discount" className="py-20 px-6 border-t border-white/5 bg-black/20">
                <div className="container mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="glass-container p-12 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-purple-500/20"
                    >
                        <h2 className="text-3xl font-bold mb-4">Want a special discount?</h2>
                        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                            Join our mailing list to receive a limited-time 20% off code for your first month of Pro.
                        </p>

                        <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                            <Input
                                placeholder="Enter your email"
                                type="email"
                                className="bg-black/40 border-white/10 h-11"
                            />
                            <Button type="submit" size="lg" className="bg-purple-600 hover:bg-purple-700 text-white shrink-0">
                                Get Code <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
