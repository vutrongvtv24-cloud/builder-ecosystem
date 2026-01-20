"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { usePosts } from "@/hooks/usePosts";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { PostCard } from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CreatePost } from "./CreatePost";
import { useInView } from "react-intersection-observer";

interface FeedProps {
    communityId?: string;
}

export function Feed({ communityId }: FeedProps) {
    const { posts, loading, hasMore, loadMore, createPost, toggleLike } = usePosts(communityId);
    const { user } = useSupabaseAuth();

    // Infinite Scroll Ref
    // When this element comes into view, we trigger loadMore
    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasMore) {
            loadMore();
        }
    }, [inView, hasMore, loadMore]);

    const handlePost = async (content: string, image?: File) => {
        try {
            await createPost(content, image);
            toast.success("Post created! 📝");
        } catch (error) {
            console.error("Failed to post:", error);
            toast.error("Failed to create post. Please try again.");
        }
    };

    // Filter Global posts (those without community_id, already filtered by usePosts default)
    // Actually usePosts returns what backend gives. The hook automatically handles global/community logic.
    // If we are in Feed component (Home), usePosts() is called without arg, so it returns global posts.

    if (loading && posts.length === 0) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto pb-10">
                <Card className="p-6">
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                </Card>
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                        <div className="flex gap-4 mb-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                        </div>
                        <Skeleton className="h-24 w-full mb-4" />
                        <div className="flex gap-4">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-10">
            {/* Create Post */}
            {user ? (
                <div className="mb-6">
                    <CreatePost
                        onPost={handlePost}
                        user={{
                            name: user.user_metadata.full_name,
                            avatar: user.user_metadata.avatar_url,
                            handle: user.email?.split('@')[0]
                        }}
                    />
                </div>
            ) : (
                <Card className="mb-6 text-center py-6 bg-muted/20 border-dashed">
                    <p className="text-muted-foreground">Log in to share your journey.</p>
                </Card>
            )}

            {/* Posts */}
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    onToggleLike={toggleLike}
                />
            ))}

            {/* Loading Indicator for Infinite Scroll */}
            {hasMore && (
                <div ref={ref} className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!hasMore && posts.length > 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                    You've reached the end! 🎉
                </p>
            )}
        </div>
    );
}
