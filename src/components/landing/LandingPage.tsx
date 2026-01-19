
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Trophy, Users, Zap } from "lucide-react";

export function LandingPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-8 px-4">
                <div className="space-y-4 max-w-3xl">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                        The Ecosystem for <br />
                        <span className="text-primary">Indie Builders</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
                        Connect, share your journey, verify your skills, and level up with a community of passionate makers.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="text-lg px-8 h-12" asChild>
                        <Link href="/auth">
                            Start Building Now <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="text-lg px-8 h-12" asChild>
                        <Link href="#features">
                            Learn More
                        </Link>
                    </Button>
                </div>

                {/* Abstract Visual Element */}
                <div className="w-full max-w-5xl mt-12 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 h-20 bottom-0" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50 blur-[1px]">
                        <div className="h-40 bg-zinc-800/50 rounded-lg border border-zinc-700/50 animate-pulse" style={{ animationDelay: '0s' }} />
                        <div className="h-40 bg-zinc-800/50 rounded-lg border border-zinc-700/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="h-40 bg-zinc-800/50 rounded-lg border border-zinc-700/50 animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-muted/30">
                <div className="container max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16">Everything you need to grow</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={<Users className="h-10 w-10 text-blue-500" />}
                            title="Community"
                            description="Connect with like-minded builders. Share updates and get feedback."
                        />
                        <FeatureCard
                            icon={<Trophy className="h-10 w-10 text-yellow-500" />}
                            title="Gamification"
                            description="Earn XP, unlock badges, and climb the leaderboard as you build."
                        />
                        <FeatureCard
                            icon={<Zap className="h-10 w-10 text-purple-500" />}
                            title="Realtime"
                            description="Instant notifications, live chat, and realtime feed updates."
                        />
                        <FeatureCard
                            icon={<Code2 className="h-10 w-10 text-green-500" />}
                            title="Open Source"
                            description="Built for developers, by developers. Transparent and hackable."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 text-center px-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h2 className="text-3xl font-bold">Ready to Join?</h2>
                    <p className="text-muted-foreground">
                        Join hundreds of other builders who are shipping products every day.
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/auth">Create Free Account</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-6 rounded-xl bg-background border hover:border-primary/50 transition-colors space-y-4">
            <div className="p-3 w-fit rounded-lg bg-muted">{icon}</div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}
