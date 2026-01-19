"use client";

import { Search, Bell, Menu, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";

export function Header() {
    const { user, signInWithGoogle, signOut } = useSupabaseAuth();
    const { notifications, unreadCount, markAsRead } = useNotifications();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="lg:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                    <span className="font-bold text-xl tracking-tight hidden sm:block">
                        THE ALL IN PLAN
                    </span>
                </div>

                {/* Center Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    <a href="#" className="text-foreground hover:text-primary font-medium border-b-2 border-primary py-1">Community</a>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors py-1">Courses</a>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors py-1">Leaderboards</a>
                </nav>

                {/* Right Tools */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Search */}
                    <div className="relative hidden md:block w-64">
                        <SearchLogic />
                    </div>

                    {/* Notifications */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative" onClick={markAsRead}>
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80 p-0">
                            <div className="p-4 border-b font-semibold text-sm">Notifications</div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <div key={n.id} className="p-3 border-b last:border-0 hover:bg-muted/50 text-sm flex gap-3">
                                            <div className="mt-1">
                                                {n.type === 'like' && '❤️'}
                                                {n.type === 'comment' && '💬'}
                                                {n.type === 'badge' && '🏆'}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="leading-snug">
                                                    <span className="font-semibold">{n.actor?.full_name || "System"}</span> {n.message}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-9 w-9 border cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={user.user_metadata.avatar_url || ""} />
                                    <AvatarFallback>{user.user_metadata.full_name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/profile/${user.id}`} className="cursor-pointer">
                                        User Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut()}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild className="gap-2">
                            <Link href="/auth" className="flex items-center gap-2">
                                <LogIn className="h-4 w-4" />
                                Sign In
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
}

import { useSearch } from "@/hooks/useSearch";

function SearchLogic() {
    const { query, setQuery, results, loading } = useSearch();
    const [open, setOpen] = useState(false);

    // Hide results when clicking outside (simple hack, improved with click-away listener later)
    useEffect(() => {
        if (!query) setOpen(false);
        else setOpen(true);
    }, [query]);

    return (
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search..."
                className="pl-9 h-9 bg-muted/50 border-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (query) setOpen(true) }}
                onBlur={() => { setTimeout(() => setOpen(false), 200) }} // Delay to allow click on result
            />

            {open && results.length > 0 && (
                <div className="absolute top-10 left-0 w-full bg-popover border rounded-md shadow-md z-50 overflow-hidden">
                    {loading && <div className="p-2 text-xs text-muted-foreground">Searching...</div>}
                    {results.map((r) => (
                        <Link key={r.type + r.id} href={r.url} className="block p-2 hover:bg-accent flex items-center gap-2 cursor-pointer transition-colors">
                            {r.type === 'profile' ? (
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={r.avatar} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="h-6 w-6 flex items-center justify-center bg-secondary rounded-full text-[10px]">📝</div>
                            )}
                            <div className="overflow-hidden">
                                <div className="text-sm font-medium truncate">{r.title}</div>
                                {r.subtitle && <div className="text-[10px] text-muted-foreground truncate">{r.subtitle}</div>}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from "react";
