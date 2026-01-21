"use client";

import { useEffect, useState, use } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useGamification } from "@/context/GamificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, ShieldCheck, Clock, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { Feed } from "@/components/feed/Feed";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePost } from "@/components/feed/CreatePost";
import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "@/components/feed/PostCard";

interface Community {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    cover_image?: string;
    required_level: number;
}

interface MemberStatus {
    role: 'admin' | 'moderator' | 'member';
    status: 'pending' | 'approved' | 'rejected';
}

export default function ClassPage({ params }: { params: Promise<{ slug: string }> }) {
    // Unwrap params using React.use()
    const { slug } = use(params);

    const [community, setCommunity] = useState<Community | null>(null);
    const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [joinLoading, setJoinLoading] = useState(false);

    // Admin state
    const [pendingMembers, setPendingMembers] = useState<any[]>([]);

    const supabase = createClient();
    const { user } = useSupabaseAuth();
    const { level } = useGamification();

    // Use customized hooks
    const {
        posts,
        loading: postsLoading,
        createPost,
        toggleLike,
        fetchPosts
    } = usePosts(community?.id);

    useEffect(() => {
        const fetchCommunityData = async () => {
            if (!slug) return;
            setLoading(true);

            // 1. Fetch Community Info
            const { data: commData, error } = await supabase
                .from('communities')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !commData) {
                // If not found in DB, fallback to mock-like behavior or empty
                // For "Youtube Creators", we expect it to exist if migration ran.
                // If not, we might manually set it for demo if DB is empty
                if (slug === 'youtube-creators') {
                    // Fallback for visual testing if DB insert failed
                    setCommunity({
                        id: 'dummy-id', // fetch will fail with this but UI will show
                        slug: 'youtube-creators',
                        name: 'Youtube Creators',
                        description: 'Cộng đồng dành cho những nhà sáng tạo nội dung Youtube.',
                        icon: 'Youtube',
                        required_level: 0
                    });
                }
            } else {
                setCommunity(commData);
            }

            setLoading(false);
        };

        fetchCommunityData();
    }, [slug, supabase]);

    // Check Membership
    useEffect(() => {
        const checkMembership = async () => {
            if (!user || !community?.id || community.id === 'dummy-id') return;

            const { data } = await supabase
                .from('community_members')
                .select('role, status')
                .eq('community_id', community.id)
                .eq('user_id', user.id)
                .single();

            if (data) {
                setMemberStatus(data as MemberStatus);
            } else {
                setMemberStatus(null);
            }
        };

        if (community) checkMembership();
    }, [user, community, supabase]);

    // Admin: Fetch Pending Request
    useEffect(() => {
        if (memberStatus?.role === 'admin' && community?.id) {
            const fetchPending = async () => {
                const { data } = await supabase
                    .from('community_members')
                    .select('*, profiles(full_name, avatar_url, level)')
                    .eq('community_id', community.id)
                    .eq('status', 'pending');
                if (data) setPendingMembers(data);
            };
            fetchPending();
        }
    }, [memberStatus, community, supabase]);


    const handleJoin = async () => {
        if (!user || !community) return;
        setJoinLoading(true);
        try {
            const { error } = await supabase
                .from('community_members')
                .insert({
                    community_id: community.id,
                    user_id: user.id,
                    status: 'pending' // Default to pending
                });

            if (error) throw error;
            toast.success("Request sent! Waiting for admin approval.");
            setMemberStatus({ role: 'member', status: 'pending' });
        } catch (error) {
            console.error(error);
            toast.error("Failed to join community.");
        } finally {
            setJoinLoading(false);
        }
    };

    const handleCreatePost = async (content: string, image?: File) => {
        if (!community) return;
        // Check Level Requirement
        if (level < 2) {
            toast.error("You need Level 2 to post in this class!");
            return;
        }

        try {
            await createPost(content, image);
            toast.success("Post submitted! Pending admin approval.");
            fetchPosts(); // Refresh list to maybe show pending post
        } catch (error) {
            toast.error("Failed to post.");
        }
    };

    const handleApproveMember = async (memberId: string) => {
        const { error } = await supabase
            .from('community_members')
            .update({ status: 'approved' })
            .eq('id', memberId);

        if (!error) {
            toast.success("Member approved!");
            setPendingMembers(prev => prev.filter(p => p.id !== memberId));
        }
    };

    const handleRejectMember = async (memberId: string) => {
        const { error } = await supabase
            .from('community_members')
            .delete()
            .eq('id', memberId);

        if (!error) {
            toast.success("Member request rejected!");
            setPendingMembers(prev => prev.filter(p => p.id !== memberId));
        } else {
            toast.error("Failed to reject member");
        }
    };

    const handleBlockMember = async (memberId: string, userId: string) => {
        // Remove from community
        await supabase
            .from('community_members')
            .delete()
            .eq('id', memberId);

        // Mark user as blocked in profiles
        const { error } = await supabase
            .from('profiles')
            .update({ status: 'blocked' })
            .eq('id', userId);

        if (!error) {
            toast.success("Member has been blocked!");
            setPendingMembers(prev => prev.filter(p => p.id !== memberId));
        } else {
            toast.error("Failed to block member");
        }
    };

    const handleApprovePost = async (postId: string) => {
        const { error } = await supabase
            .from('posts')
            .update({ status: 'approved' })
            .eq('id', postId);

        if (!error) {
            toast.success("Post approved!");
            fetchPosts();
        }
    };

    const handleRejectPost = async (postId: string) => {
        const { error } = await supabase
            .from('posts')
            .delete() // Rejecting deletes it
            .eq('id', postId);

        if (!error) {
            toast.success("Post rejected and removed.");
            fetchPosts();
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Class...</div>;
    if (!community) return <div className="p-8 text-center">Class not found.</div>;

    const isMember = memberStatus?.status === 'approved';
    const isPending = memberStatus?.status === 'pending';
    const isCommunityAdmin = memberStatus?.role === 'admin';
    const isGlobalAdmin = user?.email === 'vutrongvtv24@gmail.com';
    const isAdmin = isCommunityAdmin || isGlobalAdmin;

    // Filter posts for Admin (show pending) vs Member (show only approved - handled by API/Hook mostly but let's double check)
    // Actually usePosts returns what query gives. We modified query to show pending if admin in RLS? 
    // Wait, usePosts hook filters by community_id. Admin RLS allows seeing pending. Normal user RLS hides pending.
    // So 'posts' array already contains correct visibility data.
    // We just need to visually separate them or badge them (which PostCard does).

    const pendingPosts = posts.filter(p => p.status === 'pending');
    const approvedPosts = posts.filter(p => p.status === 'approved' || !p.status); // Default approved

    return (
        <div className="space-y-6 container max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="relative rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm text-card-foreground">
                <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90"></div>
                <div className="absolute -bottom-12 left-8 flex items-end gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-card p-2 shadow-xl border border-border">
                        <div className="w-full h-full bg-primary/10 rounded-xl flex items-center justify-center text-4xl">
                            {community.icon === 'Youtube' ? '📺' : '📚'}
                        </div>
                    </div>
                </div>
                <div className="pt-16 pb-6 px-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{community.name}</h1>
                        <p className="text-muted-foreground mt-1 max-w-xl">{community.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Private Group</span>
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {community.required_level > 0 ? `Level ${community.required_level}+ Required` : 'Open to All'}</span>
                        </div>
                    </div>
                    <div>
                        {!isMember ? (
                            isPending ? (
                                <Button disabled variant="secondary" className="gap-2">
                                    <Clock className="w-4 h-4" /> Request Pending
                                </Button>
                            ) : (
                                <Button onClick={handleJoin} disabled={joinLoading} className="gap-2">
                                    <UserPlus className="w-4 h-4" /> Join Class
                                </Button>
                            )
                        ) : (
                            <Button variant="outline" className="gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" /> Member
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <Tabs defaultValue="feed" className="w-full mt-8">
                <TabsList>
                    <TabsTrigger value="feed">Discussion</TabsTrigger>
                    {isAdmin && <TabsTrigger value="admin" className="text-orange-500">Admin Dashboard ({pendingMembers.length + pendingPosts.length})</TabsTrigger>}
                    <TabsTrigger value="about">About</TabsTrigger>
                </TabsList>

                <TabsContent value="feed" className="space-y-6 mt-6">
                    {/* Posting Area */}
                    {isMember ? (
                        <>
                            <div className="bg-background rounded-xl border border-border/50 p-4">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    Create Post
                                    {level < 2 && <span className="text-xs font-normal text-red-500 bg-red-500/10 px-2 py-0.5 rounded">(Level 2 Required)</span>}
                                </h3>
                                <CreatePost
                                    onPost={handleCreatePost}
                                    user={user ? { ...user, name: user.user_metadata.full_name, avatar: user.user_metadata.avatar_url, handle: "@me" } : null}
                                    placeholder={level < 2 ? "You need Level 2 to post..." : "Share something with the class..."}
                                    disabled={level < 2}
                                />
                            </div>

                            {/* Feed List */}
                            <div className="space-y-4">
                                {postsLoading ? (
                                    <div className="text-center py-10">Loading discussions...</div>
                                ) : approvedPosts.length > 0 ? (
                                    approvedPosts.map(post => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            onToggleLike={(id) => toggleLike(id, post.liked_by_user)}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-10 bg-muted/20 rounded-xl">
                                        <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-xl border border-dashed text-center">
                            <Lock className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-xl font-bold">Content Locked</h3>
                            <p className="text-muted-foreground max-w-sm mt-2">
                                You must join this class to view and participate in discussions.
                            </p>
                            <Button onClick={handleJoin} disabled={joinLoading || isPending} className="mt-6">
                                {isPending ? "Waiting for Approval" : "Join Now"}
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="admin" className="space-y-6 mt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Member Requests */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        Member Requests
                                        <Badge variant="secondary">{pendingMembers.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {pendingMembers.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No pending requests.</p>
                                    ) : (
                                        pendingMembers.map((m: any) => (
                                            <div key={m.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={m.profiles?.avatar_url} />
                                                        <AvatarFallback>{m.profiles?.full_name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-sm">{m.profiles?.full_name}</div>
                                                        <div className="text-xs text-muted-foreground">Level {m.profiles?.level}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleApproveMember(m.id)}
                                                    >
                                                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => handleRejectMember(m.id)}
                                                    >
                                                        <XCircle className="h-3 w-3 mr-1" /> Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="h-7 text-xs"
                                                        onClick={() => handleBlockMember(m.id, m.user_id)}
                                                    >
                                                        Block
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>

                            {/* Pending Posts */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        Pending Posts
                                        <Badge variant="secondary">{pendingPosts.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {pendingPosts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No pending posts.</p>
                                    ) : (
                                        pendingPosts.map(post => (
                                            <div key={post.id} className="p-3 bg-secondary/20 rounded-lg space-y-3">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={post.user.avatar} />
                                                        <AvatarFallback>U</AvatarFallback>
                                                    </Avatar>
                                                    {post.user.name}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                                                {post.image_url && <div className="text-xs text-blue-500">[Contains Image]</div>}
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="h-7 text-xs w-full bg-green-600 hover:bg-green-700" onClick={() => handleApprovePost(post.id)}>Approve</Button>
                                                    <Button size="sm" variant="destructive" className="h-7 text-xs w-full" onClick={() => handleRejectPost(post.id)}>Reject</Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}

                <TabsContent value="about">
                    <Card>
                        <CardHeader><CardTitle>About this Class</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">
                                {community.description}
                            </p>
                            <div className="mt-6 space-y-2">
                                <h4 className="font-semibold">Community Rules</h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                    <li>Be respectful to other members.</li>
                                    <li>No spam or self-promotion without permission.</li>
                                    <li>Share high-quality knowledge and experiences.</li>
                                    <li>Posts must be approved by admins.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
