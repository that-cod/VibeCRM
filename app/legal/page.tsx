/**
 * @fileoverview Legal documentation page with Privacy Policy, Terms, etc.
 * 
 * Reasoning:
 * - Consolidated legal page with all required documentation
 * - Clean typography for readability
 * - Static content with Lorem Ipsum placeholders
 * 
 * Dependencies:
 * - components/fluid-background for consistent branding
 * - components/footer for site navigation
 */

import { FluidBackground } from "@/components/fluid-background"
import { Footer } from "@/components/footer"

export default function LegalPage() {
    return (
        <main className="min-h-screen relative font-sans text-white">
            <FluidBackground />

            <div className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-3xl glass-container p-8 md:p-12 mb-12">
                    <h1 className="text-4xl font-bold mb-12 border-b border-white/10 pb-6">Legal Documentation</h1>

                    <div className="space-y-12 text-gray-300">
                        {/* Privacy Policy */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Privacy Policy</h2>
                            <p className="mb-4">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                            <p className="mb-4">
                                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                            </p>
                        </section>

                        {/* Cookie Settings */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Cookie Settings</h2>
                            <p className="mb-4">
                                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                            </p>
                            <p className="mb-4">
                                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
                            </p>
                        </section>

                        {/* Terms of Service */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Terms of Service</h2>
                            <p className="mb-4">
                                At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
                            </p>
                            <p className="mb-4">
                                Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
                            </p>
                        </section>

                        {/* Platform Rules */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Platform Rules</h2>
                            <p className="mb-4">
                                Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
                            </p>
                            <p className="mb-4">
                                Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.
                            </p>
                        </section>

                        {/* Report Abuse */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Report Abuse</h2>
                            <p className="mb-4">
                                Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.
                            </p>
                            <p className="mb-4">
                                Please contact our support team immediately if you observe any violations of these terms or abusive behavior on the platform.
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
