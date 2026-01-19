
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Share2, MoreHorizontal, Send } from "lucide-react";
import { UI_Post } from "@/hooks/usePosts";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Link from "next/link";

interface PostCardProps {
    post: UI_Post;
    onToggleLike: (postId: string, currentStatus: boolean) => void;
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user: {
        name: string;
        avatar: string;
    };
}

export function PostCard({ post, onToggleLike }: PostCardProps) {
    const { user } = useSupabaseAuth();
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localCommentsCount, setLocalCommentsCount] = useState(post.comments);

    const supabase = createClient();

    // Fetch comments when section is opened
    useEffect(() => {
        if (showComments && comments.length === 0) {
            fetchComments();
        }
    }, [showComments]);

    const fetchComments = async () => {
        setIsLoadingComments(true);
        const { data, error } = await supabase
            .from("comments")
            .select(`
                id,
                content,
                created_at,
                profiles (
                    full_name,
                    avatar_url
                )
            `)
            .eq("post_id", post.id)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching comments:", error);
        } else {
            setComments((data as unknown as {
                id: string;
                content: string;
                created_at: string;
                profiles: { full_name: string; avatar_url: string } | null;
            }[]).map((c) => ({
                id: c.id,
                content: c.content,
                created_at: c.created_at,
                user: {
                    name: c.profiles?.full_name || "Anonymous",
                    avatar: c.profiles?.avatar_url || "",
                }
            })));
        }
        setIsLoadingComments(false);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !user) return;

        setIsSubmitting(true);
        try {
            const { error, data } = await supabase
                .from("comments")
                .insert({
                    post_id: post.id,
                    user_id: user.id,
                    content: commentText.trim()
                })
                .select()
                .single();

            if (error) throw error;

            // Optimistic update
            const newComment: Comment = {
                id: data.id,
                content: commentText,
                created_at: new Date().toISOString(),
                user: {
                    name: user.user_metadata.full_name || "Me",
                    avatar: user.user_metadata.avatar_url || "",
                }
            };

            setComments([...comments, newComment]);
            setCommentText("");
            setLocalCommentsCount(prev => prev + 1);
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.user.id}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                        <Avatar>
                            <AvatarImage src={post.user.avatar} />
                            <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/profile/${post.user.id}`} className="font-semibold text-sm flex items-center gap-2 hover:underline cursor-pointer">
                            {post.user.name}
                            {post.user.title && (
                                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-normal no-underline">
                                    {post.user.title}
                                </span>
                            )}
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="text-xs text-muted-foreground">{post.time}</div>
                            {post.status === 'pending' && (
                                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                    Pending Approval
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <p className="whitespace-pre-wrap text-sm leading-relaxed mb-3">
                    {post.content}
                </p>
                {post.image_url && (
                    <div className="relative w-full rounded-md overflow-hidden bg-muted/20">
                        <img
                            src={post.image_url}
                            alt="Post Image"
                            loading="lazy"
                            className="w-full h-auto max-h-[500px] object-cover"
                        />
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col p-0">
                <div className="flex w-full justify-between border-t bg-muted/20 p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 gap-2 hover:text-red-500 hover:bg-red-500/10 transition-colors ${post.liked_by_user ? "text-red-500" : "text-muted-foreground"}`}
                        onClick={() => onToggleLike(post.id, post.liked_by_user)}
                    >
                        <Heart className={`h-4 w-4 ${post.liked_by_user ? "fill-current" : ""}`} />
                        {post.likes}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        onClick={() => setShowComments(!showComments)}
                    >
                        <MessageSquare className="h-4 w-4" />
                        {localCommentsCount}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 gap-2 text-muted-foreground bg-transparent">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                </div>

                {/* Confirm Logic: If showComments is true, render comments section */}
                {showComments && (
                    <div className="w-full border-t bg-background px-4 py-3 space-y-4">
                        {/* Comment Logic */}
                        <div className="space-y-3 pl-2 border-l-2 border-muted">
                            {isLoadingComments ? (
                                <p className="text-xs text-muted-foreground">Loading comments...</p>
                            ) : comments.length > 0 ? (
                                comments.map(comment => (
                                    <div key={comment.id} className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-xs">{comment.user.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-muted-foreground mt-0.5">{comment.content}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No comments yet. Be the first!</p>
                            )}
                        </div>

                        {/* Input */}
                        {user ? (
                            <form onSubmit={handleCommentSubmit} className="flex gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.user_metadata?.avatar_url} />
                                    <AvatarFallback>Me</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="flex-1 bg-muted/50 rounded-full px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <Button type="submit" size="icon" className="h-8 w-8 rounded-full" disabled={!commentText.trim() || isSubmitting}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <p className="text-xs text-center text-muted-foreground">Sign in to comment</p>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
