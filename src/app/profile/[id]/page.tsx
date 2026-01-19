"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProfile, canChangeName, canChangeAvatar } from "@/lib/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, MessageSquare, Users } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { usePosts } from "@/hooks/usePosts";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ChangeNameDialog } from "@/components/profile/ChangeNameDialog";
import { ChangeAvatarDialog } from "@/components/profile/ChangeAvatarDialog";
import { FollowButton } from "@/components/profile/FollowButton";

interface ProfileBadge {
    id: string;
    name: string;
    icon: string;
    description?: string;
}

interface ProfilePost {
    id: string;
    content: string;
    image_url?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
}

interface ProfileData {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    bio?: string;
    level: number;
    xp: number;
    role: string;
    created_at: string;
    followers_count?: number;
    following_count?: number;
    badges: ProfileBadge[];
    posts: ProfilePost[];
}

export default function ProfilePage() {
    const params = useParams();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [userCanChangeName, setUserCanChangeName] = useState(false);
    const [userCanChangeAvatar, setUserCanChangeAvatar] = useState(false);
    const { user: authUser } = useSupabaseAuth();
    const { toggleLike } = usePosts();


    // Better Approach for Posts in Profile: 
    // We fetched raw posts in fetchProfile. We need to know if current user liked them.
    // Given the constraints, let's keep it simple: Show posts without interactive Like for now, 
    // OR fetch 'liked' status.

    useEffect(() => {
        if (params?.id) {
            loadProfile(params.id as string);
        }
    }, [params?.id]);

    // Re-check permissions when authUser becomes available
    useEffect(() => {
        const checkPermissions = async () => {
            if (authUser?.id && params?.id && authUser.id === params.id) {
                const [canName, canAvatar] = await Promise.all([
                    canChangeName(authUser.id),
                    canChangeAvatar(authUser.id)
                ]);
                setUserCanChangeName(canName);
                setUserCanChangeAvatar(canAvatar);
            }
        };
        checkPermissions();
    }, [authUser?.id, params?.id]);

    const loadProfile = async (id: string) => {
        setLoading(true);
        const data = await fetchProfile(id) as ProfileData | null;
        setProfile(data);
        setLoading(false);
    };

    if (loading) return <div className="p-10 text-center">Loading Profile...</div>;
    if (!profile) return <div className="p-10 text-center">User not found.</div>;

    return (
        <div className="container max-w-4xl mx-auto py-8">
            {/* Header */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                <AvatarImage src={profile.avatar_url} />
                                <AvatarFallback className="text-2xl">{profile.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            {/* Avatar change button - only for own profile */}
                            {authUser?.id === profile.id && (
                                <ChangeAvatarDialog
                                    userId={profile.id}
                                    currentAvatar={profile.avatar_url}
                                    currentName={profile.full_name}
                                    canChange={userCanChangeAvatar}
                                    onAvatarChanged={(newUrl) => setProfile({ ...profile, avatar_url: newUrl })}
                                />
                            )}
                        </div>

                        <div className="flex-1 space-y-2">
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                                    {profile.full_name}
                                    {/* Edit name button - only for own profile */}
                                    {authUser?.id === profile.id && (
                                        <ChangeNameDialog
                                            userId={profile.id}
                                            currentName={profile.full_name}
                                            canChange={userCanChangeName}
                                            onNameChanged={(newName) => setProfile({ ...profile, full_name: newName })}
                                        />
                                    )}
                                    {/* Badges next to name */}
                                    <div className="flex gap-1">
                                        {profile.badges.slice(0, 5).map((badge: ProfileBadge) => (
                                            <span key={badge.id} className="text-lg" title={badge.name}>{badge.icon}</span>
                                        ))}
                                    </div>
                                </h1>
                                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                    Member since {new Date(profile.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                <Badge variant="secondary" className="px-3 py-1">Level {profile.level}</Badge>
                                <Badge variant="outline" className="px-3 py-1">{profile.xp} XP</Badge>
                                <Badge variant="outline" className="px-3 py-1">{profile.role}</Badge>
                                <Badge variant="outline" className="px-3 py-1 gap-1">
                                    <Users className="h-3 w-3" />
                                    {profile.followers_count || 0} Followers
                                </Badge>
                                <Badge variant="outline" className="px-3 py-1">
                                    {profile.following_count || 0} Following
                                </Badge>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                <FollowButton targetUserId={profile.id} />
                                {authUser?.id !== profile.id && (
                                    <Link href={`/messages?userId=${profile.id}`}>
                                        <Button size="sm" variant="outline" className="gap-2">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            Message
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            {profile.bio && (
                                <p className="text-sm max-w-xl mx-auto md:mx-0">{profile.bio}</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Stats & Badges */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                Badges ({profile.badges.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-2">
                                {profile.badges.map((badge: ProfileBadge) => (
                                    <div key={badge.id} className="aspect-square bg-secondary/50 rounded-lg flex items-center justify-center text-2xl" title={badge.name}>
                                        {badge.icon}
                                    </div>
                                ))}
                                {profile.badges.length === 0 && (
                                    <div className="col-span-4 text-sm text-muted-foreground text-center py-4">
                                        No badges yet
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Posts</span>
                                <span className="font-bold">{profile.posts.length}</span>
                            </div>
                            {/* Add more stats later */}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Activity Feed */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="posts">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="posts">Posts</TabsTrigger>
                            <TabsTrigger value="about">About</TabsTrigger>
                        </TabsList>
                        <TabsContent value="posts" className="space-y-4 mt-6">
                            {profile.posts.length > 0 ? (
                                profile.posts.map((post: ProfilePost) => (
                                    <PostCard
                                        key={post.id}
                                        post={{
                                            ...post,
                                            user: {
                                                id: profile.id,
                                                name: profile.full_name,
                                                avatar: profile.avatar_url,
                                                handle: "@user",
                                                title: `Lvl ${profile.level}`
                                            },
                                            likes: post.likes_count,
                                            comments: post.comments_count,
                                            time: new Date(post.created_at).toLocaleDateString(),
                                            liked_by_user: false
                                        }}
                                        onToggleLike={() => toggleLike(post.id, false)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg">
                                    No posts yet.
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="about">
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-bold mb-2">Bio</h3>
                                    <p className="text-sm text-muted-foreground">{profile.bio || "No bio added."}</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
