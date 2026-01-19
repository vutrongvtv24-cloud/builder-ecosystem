
/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'https',
                hostname: '*.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
};

console.log("--- BUILD DEBUG ---");
console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Existent" : "MISSING");
console.log("-------------------");

export default nextConfig;
