import { Sword, Wand, Crosshair, Users, Coins } from "lucide-react";

export const RPG_CLASSES = [
    {
        id: "warrior",
        name: "Warrior",
        skill: "Supply",
        icon: Sword,
        color: "text-red-500",
        description: "Master of Product",
        path: "/class/warrior",
        requiredLevel: 0,
    },
    {
        id: "magician",
        name: "Magician",
        skill: "Offer",
        icon: Wand,
        color: "text-blue-500",
        description: "Master of Offers",
        path: "/class/magician",
        requiredLevel: 2,
    },
    {
        id: "bowman",
        name: "Bowman",
        skill: "Attract",
        icon: Crosshair,
        color: "text-green-500",
        description: "Master of Traffic",
        path: "/class/bowman",
        requiredLevel: 5,
    },
    {
        id: "thief",
        name: "Thief",
        skill: "Convert",
        icon: Users,
        color: "text-purple-500",
        description: "Master of Sales",
        path: "/class/thief",
        requiredLevel: 8,
    },
    {
        id: "pirate",
        name: "Pirate",
        skill: "Collect",
        icon: Coins,
        color: "text-yellow-500",
        description: "Master of Finance",
        path: "/class/pirate",
        requiredLevel: 10,
    },
];

export const SPACES = [
    { name: "News", path: "/space/news", locked: false, requiredLevel: 0 },
    { name: "Job Market", path: "/space/job-market", locked: false, requiredLevel: 3 },
    { name: "Vibe Coding", path: "/space/vibe-coding", locked: true, requiredLevel: 5 },
    { name: "Show Your Win", path: "/space/wins", locked: false, requiredLevel: 0 },
    { name: "Awards", path: "/space/awards", locked: false, requiredLevel: 0 },
];

export const MOCK_USER = {
    name: "Builder User",
    handle: "@builder",
    level: 5,
    title: "Newbie Builder",
    xp: 45, // Percentage
    avatar: "https://github.com/shadcn.png",
    badges: [
        { name: "Starter", icon: "🌱", unlocked: true },
        { name: "Contributor", icon: "🤝", unlocked: false },
        { name: "Legend", icon: "👑", unlocked: false },
    ]
};
