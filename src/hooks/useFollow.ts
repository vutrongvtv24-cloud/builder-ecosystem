"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "./useSupabaseAuth";

interface UseFollowReturn {
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
    loading: boolean;
    toggleFollow: () => Promise<void>;
}

export function useFollow(targetUserId: string): UseFollowReturn {
    const { user } = useSupabaseAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Check if current user follows target user
    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!user || !targetUserId || user.id === targetUserId) {
                setLoading(false);
                return;
            }

            // Check follow status
            const { data: followData } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', targetUserId)
                .single();

            setIsFollowing(!!followData);
            setLoading(false);
        };

        checkFollowStatus();
    }, [user, targetUserId]);

    // Fetch follower/following counts
    useEffect(() => {
        const fetchCounts = async () => {
            if (!targetUserId) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('followers_count, following_count')
                .eq('id', targetUserId)
                .single();

            if (profile) {
                setFollowersCount(profile.followers_count || 0);
                setFollowingCount(profile.following_count || 0);
            }
        };

        fetchCounts();
    }, [targetUserId]);

    const toggleFollow = async () => {
        if (!user || !targetUserId || user.id === targetUserId) {
            console.error("Cannot follow: not logged in or trying to follow self");
            return;
        }

        setLoading(true);

        if (isFollowing) {
            // Unfollow
            const { error } = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', targetUserId);

            if (!error) {
                setIsFollowing(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                console.error("Unfollow error:", error.message);
            }
        } else {
            // Follow
            const { error } = await supabase
                .from('follows')
                .insert({
                    follower_id: user.id,
                    following_id: targetUserId
                });

            if (!error) {
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            } else {
                console.error("Follow error:", error.message);
            }
        }

        setLoading(false);
    };

    return {
        isFollowing,
        followersCount,
        followingCount,
        loading,
        toggleFollow
    };
}
