"use client";

import { useState, useEffect } from "react";
import { Sparkles, Zap, Star, TrendingUp } from "lucide-react";

interface XpGain {
    id: string;
    amount: number;
    reason: string;
}

interface XpToastProps {
    xpGain: XpGain | null;
    onComplete: () => void;
}

export function XpToast({ xpGain, onComplete }: XpToastProps) {
    const [visible, setVisible] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (xpGain) {
            setVisible(true);
            setAnimating(true);

            // Hide after animation
            const timer = setTimeout(() => {
                setAnimating(false);
                setTimeout(() => {
                    setVisible(false);
                    onComplete();
                }, 300);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [xpGain, onComplete]);

    if (!visible || !xpGain) return null;

    const getIcon = () => {
        if (xpGain.amount >= 10) return <Star className="h-5 w-5 text-yellow-400" />;
        if (xpGain.amount >= 5) return <Sparkles className="h-5 w-5 text-purple-400" />;
        return <Zap className="h-5 w-5 text-blue-400" />;
    };

    return (
        <div
            className={`
                fixed top-20 right-4 z-50 
                flex items-center gap-3 
                bg-gradient-to-r from-primary/90 to-primary 
                text-primary-foreground 
                px-4 py-3 rounded-lg shadow-2xl
                border border-primary-foreground/20
                transition-all duration-300
                ${animating ? 'animate-in slide-in-from-right fade-in zoom-in-95' : 'animate-out slide-out-to-right fade-out zoom-out-95'}
            `}
        >
            {/* Icon with pulse effect */}
            <div className="relative">
                <div className="animate-ping absolute inset-0 rounded-full bg-white/30" />
                {getIcon()}
            </div>

            {/* XP Amount with bounce */}
            <div className="flex flex-col">
                <div className="flex items-center gap-1">
                    <span className="text-xl font-bold animate-bounce">
                        +{xpGain.amount}
                    </span>
                    <span className="text-sm font-medium">XP</span>
                </div>
                <span className="text-xs opacity-80">{xpGain.reason}</span>
            </div>

            {/* Sparkle particles */}
            <div className="absolute -top-1 -right-1">
                <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
            </div>
        </div>
    );
}

// Hook to manage XP toast queue
export function useXpToast() {
    const [queue, setQueue] = useState<XpGain[]>([]);
    const [current, setCurrent] = useState<XpGain | null>(null);

    const showXpGain = (amount: number, reason: string) => {
        const newGain: XpGain = {
            id: Date.now().toString(),
            amount,
            reason
        };
        setQueue(prev => [...prev, newGain]);
    };

    useEffect(() => {
        if (!current && queue.length > 0) {
            setCurrent(queue[0]);
            setQueue(prev => prev.slice(1));
        }
    }, [current, queue]);

    const handleComplete = () => {
        setCurrent(null);
    };

    return {
        current,
        showXpGain,
        handleComplete
    };
}
