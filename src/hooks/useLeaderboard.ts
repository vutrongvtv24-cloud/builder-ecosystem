
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface LeaderboardUser {
    id: string;
    full_name: string;
    avatar_url: string;
    level: number;
    xp: number;
    title?: string;
}

export function useLeaderboard() {
    const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            // Order by level DESC, then xp DESC
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url, level, xp")
                .order("level", { ascending: false })
                .order("xp", { ascending: false })
                .limit(10);

            if (error) {
                console.error("Error fetching leaderboard:", error);
            } else {
                setLeaders((data as Record<string, unknown>[]).map((user) => ({
                    id: user.id as string,
                    full_name: (user.full_name as string) || "Anonymous Builder",
                    avatar_url: user.avatar_url as string,
                    level: user.level as number,
                    xp: user.xp as number,
                    title: `Level ${user.level} Builder`
                })));
            }
            setLoading(false);
        };

        fetchLeaderboard();

        // Optional: Realtime subscription for leaderboard changes could be expensive
        // so we might just refresh it periodically or on load.
    }, []);

    return { leaders, loading };
}
