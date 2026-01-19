
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

            const userResults: SearchResult[] = (users || []).map((u: any) => ({
                type: 'profile',
                id: u.id,
                title: u.full_name,
                subtitle: "Member",
                avatar: u.avatar_url,
                url: `/profile/${u.id}`
            }));

            const postResults: SearchResult[] = (posts || []).map((p: any) => ({
                type: 'post',
                id: p.id,
                title: `${p.profiles?.full_name}: ${p.content.substring(0, 30)}...`,
                subtitle: new Date(p.created_at).toLocaleDateString(),
                url: `/feed?post=${p.id}` // Ideally we anchor link or highlight it
            }));

            setResults([...userResults, ...postResults]);
            setLoading(false);
        };

        const timeoutId = setTimeout(search, 300); // 300ms debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    return { query, setQuery, results, loading };
}
