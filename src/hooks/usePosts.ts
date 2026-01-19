
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { Database } from "@/types/supabase";

type Post = Database["public"]["Tables"]["posts"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

export type UI_Post = {
    id: string;
    user: {
        id: string;
        name: string;
        handle: string;
        avatar: string;
        title: string;
    };
    content: string;
    likes: number;
    comments: number;
    time: string;
    liked_by_user: boolean;
    image_url?: string; // Add optional image_url
};

export function usePosts() {
    const [posts, setPosts] = useState<UI_Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useSupabaseAuth();
    const supabase = createClient();

    const fetchPosts = useCallback(async () => {
        try {
            // Don't set loading to true here to avoid flickering on updates

            // 1. Fetch Posts
            const { data: postsData, error: postsError } = await supabase
                .from("posts")
                .select(`
                    *,
                    image_url,
                    profiles (
                        full_name,
                        avatar_url,
                        role,
                        level
                    )
                `)
                .order("created_at", { ascending: false });

            if (postsError) throw postsError;
            if (!postsData) return;

            // 2. Check which posts user has liked (if logged in)
            let likedPostIds = new Set<string>();
            if (user) {
                const { data: likesData } = await supabase
                    .from("likes")
                    .select("post_id")
                    .eq("user_id", user.id);

                if (likesData) {
                    likesData.forEach(l => likedPostIds.add(l.post_id));
                }
            }

            // 3. Transform Data
            const formattedPosts: UI_Post[] = postsData.map((post: any) => ({
                id: post.id,
                user: {
                    id: post.user_id,
                    name: post.profiles?.full_name || "Anonymous",
                    handle: "@user",
                    avatar: post.profiles?.avatar_url || "",
                    title: `Level ${post.profiles?.level || 1} Builder`,
                },
                content: post.content,
                likes: post.likes_count || 0,
                comments: post.comments_count || 0,
                time: new Date(post.created_at).toLocaleDateString(),
                liked_by_user: likedPostIds.has(post.id),
                image_url: post.image_url
            }));

            // Filter out any potential duplicates or bad data if needed
            setPosts(formattedPosts);
        } catch (err) {
            console.error("Error fetching posts:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase, user]);

    // Initial Fetch
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Realtime Subs
    useEffect(() => {
        const channel = supabase
            .channel('public:posts_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => fetchPosts())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPosts, supabase]);


    const createPost = async (content: string, imageFile?: File) => {
        if (!user) return;

        let imageUrl: string | undefined;
        if (imageFile) {
            const fileExtension = imageFile.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExtension}`;
            const { data, error: uploadError } = await supabase.storage
                .from('post_images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            imageUrl = supabase.storage.from('post_images').getPublicUrl(filePath).data.publicUrl;
        }

        const { error } = await supabase.from("posts").insert({
            user_id: user.id,
            content: content,
            image_url: imageUrl,
        });
        if (error) throw error;
    };

    const toggleLike = async (postId: string, currentLikeStatus: boolean) => {
        if (!user) return;

        // Optimistic UI Update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    liked_by_user: !currentLikeStatus,
                    likes: currentLikeStatus ? p.likes - 1 : p.likes + 1
                };
            }
            return p;
        }));

        try {
            if (currentLikeStatus) {
                // Unlike
                const { error } = await supabase.from("likes").delete().match({ user_id: user.id, post_id: postId });
                if (error) throw error;
            } else {
                // Like
                const { error } = await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            fetchPosts(); // Revert/Sync on error
        }
    };

    return { posts, loading, createPost, toggleLike };
}
