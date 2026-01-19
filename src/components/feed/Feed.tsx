"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Share2, MoreHorizontal, Image as ImageIcon } from "lucide-react";
import { useGamification } from "@/context/GamificationContext";
import { usePosts } from "@/hooks/usePosts";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { PostCard } from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRef } from "react";
import { compressImage } from "@/lib/imageUtils";
import { X } from "lucide-react";



export function Feed() {
    const { posts, loading, createPost, toggleLike } = usePosts();
    const { user } = useSupabaseAuth();
    const [content, setContent] = useState("");
    const { gainXp } = useGamification();
    const [isPosting, setIsPosting] = useState(false);

    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview immediate
        const objectUrl = URL.createObjectURL(file);
        setImagePreview(objectUrl);

        try {
            const compressed = await compressImage(file);
            setSelectedImage(compressed);
        } catch (error) {
            console.error("Compression failed, using original", error);
            setSelectedImage(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePost = async () => {
        if ((!content.trim() && !selectedImage) || !user) return;

        try {
            setIsPosting(true);
            await createPost(content, selectedImage || undefined);
            setContent("");
            clearImage();

            // Gamification: Award XP
            gainXp(10);
            toast.success("Post created! +10 XP");
        } catch (error) {
            console.error("Failed to post:", error);
            toast.error("Failed to create post. Please try again.");
        } finally {
            setIsPosting(false);
        }
    };

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
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <Avatar>
                                <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                                <AvatarFallback>{user.user_metadata?.full_name?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-4">
                                <textarea
                                    className="w-full bg-transparent border-none resize-none focus:outline-none text-base placeholder:text-muted-foreground min-h-[80px]"
                                    placeholder="What are you building today?"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />

                                {imagePreview && (
                                    <div className="relative w-full mb-4">
                                        <img src={imagePreview} alt="Preview" className="rounded-md max-h-[300px] object-cover" />
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="absolute top-2 right-2 h-6 w-6 rounded-full"
                                            onClick={clearImage}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}

                                <div className="flex justify-between items-center border-t pt-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleImageSelect}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-primary"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <ImageIcon className="h-4 w-4 mr-2" />
                                            Media
                                        </Button>
                                    </div>
                                    <Button size="sm" onClick={handlePost} disabled={(!content.trim() && !selectedImage) || isPosting}>
                                        {isPosting ? "Posting..." : "Post Update"}
                                    </Button>
                                </div>
                            </div >
                        </div >
                    </CardContent >
                </Card >
            ) : (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        Please sign in to post updates.
                    </CardContent>
                </Card>
            )
            }

            {/* Posts */}
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    onToggleLike={toggleLike}
                />
            ))}
        </div>
    );
}
