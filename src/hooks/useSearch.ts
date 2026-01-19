import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SearchResult {
    type: 'profile' | 'post';
    id: string;
    title: string;
    subtitle?: string;
    avatar?: string;
    url: string;
}

interface ProfileSearchRow {
    id: string;
    full_name: string;
    avatar_url: string;
}

interface PostSearchRow {
    id: string;
    content: string;
    created_at: string;
    profiles: { full_name: string } | null;
}

export function useSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const search = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);

            // 1. Search Users
            const { data: users } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .ilike('full_name', `%${query}%`)
                .limit(5);

            // 2. Search Posts (Simple content match)
            const { data: posts } = await supabase
                .from('posts')
                .select('id, content, created_at, profiles(full_name)')
                .ilike('content', `%${query}%`)
                .limit(5);

            const userResults: SearchResult[] = (users || []).map((u: Record<string, unknown>) => ({
                type: 'profile' as const,
                id: u.id as string,
                title: u.full_name as string,
                subtitle: "Member",
                avatar: u.avatar_url as string,
                url: `/profile/${u.id}`
            }));

            const postResults: SearchResult[] = (posts || []).map((p: Record<string, unknown>) => {
                const profiles = p.profiles as Record<string, unknown> | null;
                return {
                    type: 'post' as const,
                    id: p.id as string,
                    title: `${profiles?.full_name || 'Anonymous'}: ${(p.content as string).substring(0, 30)}...`,
                    subtitle: new Date(p.created_at as string).toLocaleDateString(),
                    url: `/feed?post=${p.id}`
                };
            });

            setResults([...userResults, ...postResults]);
            setLoading(false);
        };

        const timeoutId = setTimeout(search, 300); // 300ms debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    return { query, setQuery, results, loading };
}
