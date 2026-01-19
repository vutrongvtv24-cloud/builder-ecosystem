import { notFound } from "next/navigation";
import { RPG_CLASSES } from "@/data/mock";
import { PlayCircle, CheckCircle, Lock as LockIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LevelGuard } from "@/components/secure/LevelGuard";

export default async function ClassPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const rpgClass = RPG_CLASSES.find((c) => c.id === slug);

    if (!rpgClass) {
        notFound();
    }

    const MOCK_LESSONS = [
        { title: "Introduction to " + rpgClass.skill, duration: "5:20", completed: true },
        { title: "Key Principles", duration: "12:45", completed: true },
        { title: "Advanced Techniques", duration: "25:10", completed: false },
        { title: "Case Study Analysis", duration: "18:30", completed: false },
        { title: "Final Project", duration: "45:00", locked: true },
    ];

    return (
        <LevelGuard
            requiredLevel={rpgClass.requiredLevel || 0}
            fallbackTitle={`Locked Class: ${rpgClass.name}`}
            fallbackMessage={`You need to reach Level ${rpgClass.requiredLevel} to access the ${rpgClass.name} class.`}
        >
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-xl bg-secondary ${rpgClass.color} bg-opacity-10`}>
                        <rpgClass.icon className={`h-8 w-8 ${rpgClass.color}`} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{rpgClass.name} Class</h1>
                        <p className="text-muted-foreground text-lg">Mastering the Art of {rpgClass.skill}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content / Video Player */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="aspect-video bg-black/90 rounded-xl flex items-center justify-center relative group cursor-pointer overflow-hidden border border-border/50 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                            <PlayCircle className="h-20 w-20 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 relative z-10" />
                            <p className="absolute bottom-4 left-4 text-white font-medium z-10">Lesson 3: Advanced Techniques</p>
                        </div>

                        <div className="prose dark:prose-invert max-w-none">
                            <h3>About this Lesson</h3>
                            <p>In this session, we dive deep into the core mechanics of {rpgClass.skill.toLowerCase()}. You will learn how to leverage market dynamics to your advantage.</p>
                        </div>
                    </div>

                    {/* Lesson List Sidebar */}
                    <Card className="h-fit">
                        <CardContent className="p-0">
                            <div className="p-4 font-semibold border-b bg-muted/20">
                                Course Curriculum
                            </div>
                            <div className="divide-y">
                                {MOCK_LESSONS.map((lesson, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors cursor-pointer ${idx === 2 ? 'bg-secondary/50 border-l-2 border-primary' : ''}`}
                                    >
                                        <div className="mt-0.5">
                                            {lesson.completed ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : lesson.locked ? (
                                                <LockIcon className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <PlayCircle className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className={`text-sm font-medium ${lesson.completed ? 'text-muted-foreground' : ''}`}>
                                                {lesson.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {lesson.duration}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </LevelGuard>
    );
}
