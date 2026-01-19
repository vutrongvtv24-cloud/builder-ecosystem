"use client";

import { useGamification } from "@/context/GamificationContext";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LevelGuardProps {
    requiredLevel: number;
    children: React.ReactNode;
    fallbackTitle?: string;
    fallbackMessage?: string;
}

export function LevelGuard({
    requiredLevel,
    children,
    fallbackTitle = "Content Locked",
    fallbackMessage = "You need to reach a higher level to unlock this content."
}: LevelGuardProps) {
    const { level } = useGamification();

    if (level >= requiredLevel) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
            <div className="h-24 w-24 rounded-full bg-secondary/50 flex items-center justify-center">
                <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold">{fallbackTitle}</h2>
                <p className="text-muted-foreground">{fallbackMessage}</p>
                <div className="pt-4 text-sm font-medium">
                    Required Level: <span className="text-primary text-base">{requiredLevel}</span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    Current Level: <span className="text-destructive text-base">{level}</span>
                </div>
            </div>
            <Button asChild>
                <Link href="/">Return to Home</Link>
            </Button>
        </div>
    );
}
