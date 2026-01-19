import { notFound } from "next/navigation";
import { SPACES } from "@/data/mock";
import { Feed } from "@/components/feed/Feed";
import { Lock, Hash } from "lucide-react";

export default async function SpacePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const space = SPACES.find((s) => s.path === `/space/${slug}`);

    if (!space) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                        <Hash className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{space.name}</h1>
                        <p className="text-muted-foreground text-sm">Community space for {space.name} discussions</p>
                    </div>
                </div>
                {space.locked && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-full text-xs font-medium text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Members Only
                    </div>
                )}
            </div>

            <Feed />
        </div>
    );
}
