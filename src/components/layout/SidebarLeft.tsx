"use client";

import { Button } from "@/components/ui/button";
import { Lock, Home, Hash, MessageCircle } from "lucide-react";
import { RPG_CLASSES, SPACES } from "@/data/mock";
import Link from "next/link";
import { useGamification } from "@/context/GamificationContext";

export function SidebarLeft() {
    const { level } = useGamification();

    return (
        <div className="space-y-6 pb-4">
            <div className="space-y-1">
                <Button variant="secondary" className="w-full justify-start font-medium" asChild>
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Home Feed
                    </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start font-medium" asChild>
                    <Link href="/messages">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Messages
                    </Link>
                </Button>
            </div>

            <div>
                <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Community Spaces
                </h3>
                <div className="space-y-1">
                    {SPACES.map((space) => {
                        const isLocked = level < (space.requiredLevel || 0) || space.locked;
                        return (
                            <Button
                                key={space.path}
                                variant="ghost"
                                className={`w-full justify-start font-normal ${isLocked ? 'opacity-50' : ''}`}
                                asChild={!isLocked}
                            >
                                {isLocked ? (
                                    <div className="flex items-center w-full cursor-not-allowed">
                                        <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span className="flex-1 text-left">{space.name}</span>
                                        <Lock className="h-3 w-3 text-muted-foreground/70" />
                                    </div>
                                ) : (
                                    <Link href={space.path}>
                                        <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span className="flex-1 text-left">{space.name}</span>
                                    </Link>
                                )}
                            </Button>
                        )
                    })}
                </div>
            </div>

            <div>
                <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Classes
                </h3>
                <div className="space-y-1">
                    {RPG_CLASSES.map((cls) => {
                        const isLocked = level < (cls.requiredLevel || 0);
                        return (
                            <Button
                                key={cls.id}
                                variant="ghost"
                                className={`w-full justify-start font-normal group ${isLocked ? 'opacity-50' : ''}`}
                                asChild={!isLocked}
                            >
                                {isLocked ? (
                                    <div className="flex items-center w-full cursor-not-allowed">
                                        <cls.icon className={`mr-2 h-4 w-4 ${cls.color} opacity-80`} />
                                        <span className="flex-1 text-left">{cls.name}</span>
                                        <Lock className="h-3 w-3 text-muted-foreground/70" />
                                    </div>
                                ) : (
                                    <Link href={cls.path}>
                                        <cls.icon className={`mr-2 h-4 w-4 ${cls.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                                        <span className="flex-1 text-left">{cls.name}</span>
                                    </Link>
                                )}
                            </Button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
