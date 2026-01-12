/**
 * @fileoverview VibeCRM marketing homepage with glassmorphism hero and template showcase.
 * 
 * Reasoning:
 * - Fluid gradient background creates immersive "vibe" experience
 * - Template grid demonstrates CRM possibilities to users
 * - Premium unlock modal converts free users to paid tier
 * - Framer Motion provides smooth entry animations
 * 
 * Dependencies:
 * - components/fluid-background for animated gradient background
 * - components/ui for shadcn components (Button, Input, Dialog)
 * - framer-motion for scroll-based animations
 */

"use client"

import { useState } from "react"
import { FluidBackground } from "@/components/fluid-background"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SchemaPreview } from "@/components/schema-preview"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, Lock, LayoutDashboard, Database, BarChart3, Users } from "lucide-react"
import type { CRMSchema } from "@/types/schema"

export default function Home() {
    const [showUnlockModal, setShowUnlockModal] = useState(false)
    const [prompt, setPrompt] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isProvisioning, setIsProvisioning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [generatedSchema, setGeneratedSchema] = useState<CRMSchema | null>(null)
    const [showSchemaPreview, setShowSchemaPreview] = useState(false)

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter a description of your CRM")
            return
        }

        setIsGenerating(true)
        setError(null)

        try {
            const response = await fetch("/api/v1/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to generate schema")
            }

            const data = await response.json()
            setGeneratedSchema(data.schema)
            setShowSchemaPreview(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleProvision = async () => {
        if (!generatedSchema) return

        setIsProvisioning(true)
        setError(null)

        try {
            const response = await fetch("/api/v1/provision", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    schema_json: generatedSchema,
                    project_id: "demo-project" // Temporary - will be replaced with real project ID
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to provision schema")
            }

            const data = await response.json()
            alert(`Success! Created ${data.tables_created.length} tables: ${data.tables_created.join(", ")}.\n\nYou can now start adding data to your CRM!`)

            // Reset state
            setShowSchemaPreview(false)
            setGeneratedSchema(null)
            setPrompt("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsProvisioning(false)
        }
    }

    const templates = [
        { title: "SaaS Sales CRM", icon: BarChart3, color: "bg-blue-500/10 text-blue-400" },
        { title: "Real Estate Pipeline", icon: LayoutDashboard, color: "bg-green-500/10 text-green-400" },
        { title: "Agency Client Portal", icon: Users, color: "bg-purple-500/10 text-purple-400" },
        { title: "Inventory Management", icon: Database, color: "bg-orange-500/10 text-orange-400" },
        { title: "Recruiting Tracker", icon: Users, color: "bg-pink-500/10 text-pink-400" },
        { title: "Support Ticket System", icon: LayoutDashboard, color: "bg-cyan-500/10 text-cyan-400" },
    ]

    return (
        <main className="min-h-screen relative font-sans text-white">
            <FluidBackground />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 md:pt-48 md:pb-32">
                <div className="container mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="glass-container p-8 md:p-12"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                            Build your dream CRM with a <span className="text-gradient">vibe</span>.
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                            Describe your perfect workflow in plain English. AI generates the database, interface, and logic in seconds. No coding required.
                        </p>

                        <div className="relative max-w-2xl mx-auto group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                            <div className="relative flex flex-col gap-2">
                                <Input
                                    className="h-14 pl-6 pr-6 text-lg bg-black/50 border-white/10 focus-visible:ring-purple-500/50"
                                    placeholder="Describe the CRM you want to build..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleGenerate()
                                        }
                                    }}
                                    disabled={isGenerating}
                                />
                                <Button
                                    size="lg"
                                    className="w-full md:w-auto bg-white hover:bg-white/90 text-black font-semibold"
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <motion.div
                                                className="mr-2 h-4 w-4 border-2 border-black border-t-transparent rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Generate
                                        </>
                                    )}
                                </Button>
                                {error && (
                                    <p className="text-sm text-red-400 mt-2">{error}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Template Showcase */}
            <section className="py-20 px-6 relative z-10">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Explore what others have vibed</h2>
                            <p className="text-muted-foreground">Production-ready templates generated by our community</p>
                        </div>
                        <Button variant="ghost" className="hidden md:flex">
                            View all templates <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, translateY: -5 }}
                                onClick={() => setShowUnlockModal(true)}
                                className="group cursor-pointer relative aspect-video bg-black/40 border border-white/5 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300"
                            >
                                {/* Mock UI Content */}
                                <div className="absolute inset-0 p-6 flex flex-col">
                                    {/* Header Mock */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.color}`}>
                                            <template.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="h-2 w-24 bg-white/10 rounded mb-1" />
                                            <div className="h-2 w-16 bg-white/5 rounded" />
                                        </div>
                                    </div>

                                    {/* Content Mock */}
                                    <div className="space-y-3 flex-1">
                                        <div className="h-8 w-full bg-white/5 rounded-md" />
                                        <div className="space-y-2">
                                            <div className="h-2 w-full bg-white/5 rounded" />
                                            <div className="h-2 w-5/6 bg-white/5 rounded" />
                                            <div className="h-2 w-4/6 bg-white/5 rounded" />
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <Lock className="h-8 w-8 text-white/80" />
                                        <span className="font-medium">Unlock Template</span>
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <h3 className="font-semibold text-lg">{template.title}</h3>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />

            {/* Schema Preview Dialog */}
            <Dialog open={showSchemaPreview} onOpenChange={setShowSchemaPreview}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-dialog">
                    {generatedSchema && (
                        <SchemaPreview
                            schema={generatedSchema}
                            onConfirm={handleProvision}
                            onCancel={() => {
                                setShowSchemaPreview(false)
                                setGeneratedSchema(null)
                            }}
                            isProvisioning={isProvisioning}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Unlock Dialog */}
            <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
                <DialogContent className="glass-dialog text-center sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                            <Lock className="h-6 w-6 text-purple-400" />
                        </div>
                        <DialogTitle className="text-2xl mb-2">Unlock Premium Access</DialogTitle>
                        <DialogDescription className="text-gray-400 text-base">
                            Upgrade to the Pro plan to view, customize, and deploy this premium template instantly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-4">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 border-0 h-11">
                            Unlock Premium
                        </Button>
                        <Button variant="ghost" onClick={() => setShowUnlockModal(false)}>
                            Maybe Later
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    )
}
