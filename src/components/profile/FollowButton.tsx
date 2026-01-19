"use client";

import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
    targetUserId: string;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    showIcon?: boolean;
}

export function FollowButton({
    targetUserId,
    variant = "default",
    size = "sm",
    showIcon = true
}: FollowButtonProps) {
    const { user } = useSupabaseAuth();
    const { isFollowing, loading, toggleFollow } = useFollow(targetUserId);

    // Don't show button if viewing own profile or not logged in
    if (!user || user.id === targetUserId) {
        return null;
    }

    return (
        <Button
            variant={isFollowing ? "outline" : variant}
            size={size}
            onClick={toggleFollow}
            disabled={loading}
            className={`gap-2 ${isFollowing ? 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive' : ''}`}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    {showIcon && <UserMinus className="h-4 w-4" />}
                    Following
                </>
            ) : (
                <>
                    {showIcon && <UserPlus className="h-4 w-4" />}
                    Follow
                </>
            )}
        </Button>
    );
}
