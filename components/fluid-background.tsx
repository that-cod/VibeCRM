/**
 * @fileoverview Fluid background component with mouse-reactive gradients.
 * 
 * Reasoning:
 * - Uses Framer Motion for smooth animations and mouse tracking
 * - Creates ambient floating blobs with infinite looping animations
 * - Mouse cursor creates a spotlight effect using radial gradients
 * - Performance: Uses CSS transforms and CSS variables for GPU acceleration
 * 
 * Dependencies:
 * - framer-motion for animation primitives
 * - lib/utils for class name utilities
 */

"use client"

import { useMotionTemplate, useMotionValue, motion, animate } from "framer-motion"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

export function FluidBackground({ className }: { className?: string }) {
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Fluid blob animations
    // We'll create a few blobs that float around and also react slightly to mouse

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize or just specific px values? 
            // Let's use window percentage for smoother large-screen handling
            const { clientX, clientY } = e
            // We can just update the motion values directly
            // But for a "fluid" feel, maybe we don't want direct 1:1 tracking
            //Let's just track it for a "spotlight" effect
            mouseX.set(clientX)
            mouseY.set(clientY)
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [mouseX, mouseY])

    // Create a gradient background that follows the mouse
    const background = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      rgba(100, 100, 255, 0.15),
      transparent 80%
    )
  `

    return (
        <div className={cn("fixed inset-0 -z-10 overflow-hidden bg-black", className)}>
            {/* Base Gradient Layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-purple-900/20" />

            {/* Animated Blobs (Simulated Fluid) */}
            <motion.div
                className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-purple-600/20 rounded-full blur-[100px]"
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[100px]"
                animate={{
                    x: [0, -50, 0],
                    y: [0, 100, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Mouse Interaction Layer */}
            <motion.div
                className="absolute inset-0 opacity-100"
                style={{ background }}
            />
        </div>
    )
}
